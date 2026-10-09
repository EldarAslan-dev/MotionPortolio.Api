using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MotionPortfolio.Api.Data;
using MotionPortfolio.Api.Hubs;
using MotionPortfolio.Api.Models;
using RabbitMQ.Client;

namespace MotionPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InquiriesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHubContext<NotificationHub> _hubContext;

    public InquiriesController(AppDbContext context, IConfiguration configuration, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _configuration = configuration;
        _hubContext = hubContext;
    }

    const string SiteUrl = "https://www.bilgeyismirzazada.com";
    const string PayM10 = "+994 70 220 11 03";
    const string PayCard = "5411 2498 0709 6776";
    const string PayBank = "LeoBank";
    const string SenderName = "Bilgeyis Mirzazada";

    static string NewToken()
    {
        var bytes = new byte[24];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    static string Esc(string? value) => WebUtility.HtmlEncode(value ?? "");

    static string PackageName(Inquiry inquiry)
    {
        foreach (var line in (inquiry.Message ?? "").Split('\n'))
        {
            var text = line.Trim();
            if (text.StartsWith("Paket:", StringComparison.OrdinalIgnoreCase))
            {
                var name = text["Paket:".Length..].Trim();
                if (name.Length > 0) return name;
            }
        }
        return string.IsNullOrWhiteSpace(inquiry.SelectedProjectTitle) ? "Layihə" : inquiry.SelectedProjectTitle;
    }

    static void EnsureTrack(Inquiry inquiry)
    {
        if (string.IsNullOrWhiteSpace(inquiry.TrackToken)) inquiry.TrackToken = NewToken();
    }

    static string PrivateRoot()
    {
        var path = Path.Combine(Directory.GetCurrentDirectory(), "private");
        Directory.CreateDirectory(path);
        return path;
    }

    static string PrivateFile(string relative)
    {
        var full = Path.GetFullPath(Path.Combine(PrivateRoot(), relative.Replace('/', Path.DirectorySeparatorChar)));
        var root = Path.GetFullPath(PrivateRoot());
        if (!full.StartsWith(root, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Fayl yolu etibarsızdır.");
        return full;
    }

    static string SafeExt(string name)
    {
        var ext = Path.GetExtension(name).ToLowerInvariant();
        if (ext.Length is < 2 or > 7) return "";
        for (var i = 1; i < ext.Length; i++)
            if (!char.IsLetterOrDigit(ext[i])) return "";
        return ext;
    }

    static string WithoutDisplaySize(string link)
    {
        if (!link.Contains("/uploads/", StringComparison.OrdinalIgnoreCase)) return link.Trim();
        if (!Uri.TryCreate(link.Trim(), UriKind.Absolute, out var uri)) return link.Trim();
        var kept = uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Where(part => !part.StartsWith("w=", StringComparison.OrdinalIgnoreCase));
        var query = string.Join("&", kept);
        return uri.GetLeftPart(UriPartial.Path) + (query.Length == 0 ? "" : "?" + query);
    }

    static string DownloadContentType(string path)
    {
        return Path.GetExtension(path).ToLowerInvariant() switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".svg" => "image/svg+xml",
            ".pdf" => "application/pdf",
            ".mp4" => "video/mp4",
            ".mov" => "video/quicktime",
            ".webm" => "video/webm",
            ".zip" => "application/zip",
            _ => "application/octet-stream"
        };
    }

    static bool IsHttps(string? link) =>
        Uri.TryCreate(link?.Trim(), UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps;

    async Task<string> SavePrivate(IFormFile file, string folder)
    {
        var relative = folder + "/" + NewToken() + SafeExt(file.FileName);
        var dest = PrivateFile(relative);
        Directory.CreateDirectory(Path.GetDirectoryName(dest)!);
        await using var stream = new FileStream(dest, FileMode.Create);
        await file.CopyToAsync(stream);
        return relative;
    }

    static void TryDeletePrivate(string? relative)
    {
        if (string.IsNullOrWhiteSpace(relative)) return;
        try
        {
            var full = PrivateFile(relative);
            if (System.IO.File.Exists(full)) System.IO.File.Delete(full);
        }
        catch { /* köhnə fayl silinməsə belə axın davam edir */ }
    }

    string SenderAddress()
    {
        var from = _configuration["Gmail:Address"];
        return string.IsNullOrWhiteSpace(from) ? "bilgeyismirzazada@gmail.com" : from.Trim();
    }

    async Task<bool> SendHtmlMail(string to, string subject, string html, string text, string? attachmentPath = null, string? attachmentName = null)
    {
        var from = SenderAddress();
        var password = _configuration["Gmail:AppPassword"];
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(to)) return false;
        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(from, SenderName),
                Subject = subject,
                SubjectEncoding = Encoding.UTF8,
                BodyEncoding = Encoding.UTF8,
                Body = text,
                IsBodyHtml = false
            };
            message.To.Add(to.Trim());
            message.ReplyToList.Add(new MailAddress(from, SenderName));
            var htmlView = AlternateView.CreateAlternateViewFromString(html, Encoding.UTF8, MediaTypeNames.Text.Html);
            htmlView.ContentType.CharSet = "utf-8";
            message.AlternateViews.Add(htmlView);
            if (!string.IsNullOrEmpty(attachmentPath) && System.IO.File.Exists(attachmentPath))
            {
                var length = new FileInfo(attachmentPath).Length;
                if (length > 0 && length <= 20 * 1024 * 1024)
                    message.Attachments.Add(new Attachment(attachmentPath) { Name = attachmentName ?? Path.GetFileName(attachmentPath) });
            }
            using var smtp = new SmtpClient("smtp.gmail.com", 587)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(from, password)
            };
            await smtp.SendMailAsync(message);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Gmail xətası: {ex.Message}");
            return false;
        }
    }

    static string MailShell(string body) => $"""
        <!doctype html><html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;background:#ece8dd;font-family:Arial,Helvetica,sans-serif;color:#222">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#faf7ef;border-radius:12px;overflow:hidden">
        <tr><td style="background:#16130e;color:#f1ead8;padding:22px 32px;font-size:18px">{Esc(SenderName)}</td></tr>
        <tr><td style="padding:32px;font-size:15px;line-height:1.65">{body}</td></tr>
        <tr><td style="background:#16130e;color:#9a9078;padding:16px 32px;font-size:12px">Bu mesaj sifarişiniz üzrə avtomatik göndərilib.</td></tr>
        </table></td></tr></table></body></html>
        """;

    static string MailButton(string href, string label) =>
        $"<p style=\"margin:26px 0\"><a href=\"{Esc(href)}\" style=\"background:#16130e;color:#f1ead8;text-decoration:none;padding:14px 26px;border-radius:8px;display:inline-block;font-weight:bold\">{Esc(label)}</a></p>";

    static string MailRow(string key, string value) =>
        $"<tr><td style=\"padding:10px 14px;color:#7a7058;border-bottom:1px solid #e4dcc6\">{Esc(key)}</td><td style=\"padding:10px 14px;font-weight:bold;border-bottom:1px solid #e4dcc6\">{Esc(value)}</td></tr>";

    Task<bool> SendPaymentMail(Inquiry inquiry)
    {
        var tracking = $"{SiteUrl}/track/{inquiry.TrackToken}";
        var package = PackageName(inquiry);
        var html = MailShell($"""
            <p>Hörmətli <b>{Esc(inquiry.ClientName)}</b>,</p>
            <p><b>{Esc(package)}</b> layihəniz üzrə iş uğurla tamamlanıb və bütün təhvil faylları arxivləşdirilərək hazır vəziyyətə gətirilib.</p>
            <p>Faylların <b>{Esc(inquiry.ClientEmail)}</b> ünvanına çatdırılması üçün təyin olunmuş məbləği aşağıdakı üsullardan biri ilə ödəyin:</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e4dcc6;border-radius:8px;margin:18px 0">
            {MailRow("Yekun məbləğ", inquiry.Budget)}{MailRow("m10 hesabı", PayM10)}{MailRow($"Kart ({PayBank})", PayCard)}
            </table>
            <p><b>Ödənişdən sonra:</b> qəbzi (screen/çek) sifariş səhifəsində yükləyin və ya bu e-poçta cavab olaraq əlavə edin.</p>
            {MailButton(tracking, "Ödəniş Çekini Yüklə və Sifarişi İzlə")}
            <p>Ödəniş təsdiqləndiyi an orijinal materiallar və yükləmə bağlantısı avtomatik e-poçtunuza göndəriləcək.</p>
            <p>Hörmətlə,<br>{Esc(SenderName)}</p>
            """);
        var text = $"Hörmətli {inquiry.ClientName}, {package} layihəniz hazırdır.\nMəbləğ: {inquiry.Budget}\nm10: {PayM10}\nKart ({PayBank}): {PayCard}\nÇeki yükləyin: {tracking}";
        return SendHtmlMail(inquiry.ClientEmail, $"Sifarişiniz Hazırdır! (#{inquiry.OrderNumber}) — Təhvil üçün Ödəniş Bildirişi", html, text);
    }

    Task<bool> SendDeliveredMail(Inquiry inquiry, string downloadUrl, string? attachmentPath)
    {
        var html = MailShell($"""
            <p>Hörmətli <b>{Esc(inquiry.ClientName)}</b>, ödənişiniz uğurla təsdiqləndi.</p>
            <p>Layihənizin yekun faylları əlavədə və ya aşağıdakı təhlükəsiz yükləmə linkindədir:</p>
            {MailButton(downloadUrl, "Faylları Yüklə")}
            <p style="color:#7a7058;font-size:13px">Link 30 gün aktivdir. Əməkdaşlığınız üçün təşəkkür edirik!</p>
            <p>Hörmətlə,<br>{Esc(SenderName)}</p>
            """);
        var name = string.IsNullOrEmpty(attachmentPath) ? null : "files" + Path.GetExtension(attachmentPath);
        return SendHtmlMail(
            inquiry.ClientEmail,
            $"Sifarişiniz Tamamlandı (#{inquiry.OrderNumber}) — Materialların Təhvili",
            html,
            $"Ödənişiniz təsdiqləndi. Faylları yükləyin: {downloadUrl}",
            attachmentPath,
            name);
    }

    async Task<(bool ok, string message, bool emailed)> MarkPaymentPending(Inquiry inquiry, string? relativePath, string? link)
    {
        if (inquiry.Status is "Tamamlandı" or "Ləğv edildi")
            return (false, "Bu mərhələdə təhvil mümkün deyil.", false);
        EnsureTrack(inquiry);
        if (!string.IsNullOrEmpty(relativePath))
        {
            if (!string.IsNullOrEmpty(inquiry.DeliverablePath) && inquiry.DeliverablePath != relativePath)
                TryDeletePrivate(inquiry.DeliverablePath);
            inquiry.DeliverablePath = relativePath;
            inquiry.DeliverableLink = null;
        }
        else
        {
            inquiry.DeliverableLink = string.IsNullOrWhiteSpace(link) ? null : WithoutDisplaySize(link);
        }
        inquiry.DeliveredFileUrl = null;
        inquiry.Status = "Ödəniş gözlənilir";
        inquiry.StaffFileReady = false;
        await _context.SaveChangesAsync();
        var mailed = await SendPaymentMail(inquiry);
        await _hubContext.Clients.Group(inquiry.OrderNumber).SendAsync("ReceiveStatusUpdate", inquiry.Status);
        return (true, mailed
            ? "İş hazırdır. Ödəniş bildirişi müştərinin emailinə göndərildi."
            : "İş hazır kimi qeyd olundu, amma Gmail göndərilmədi.", mailed);
    }

    static string PublicFileUrl(string url)
    {
        var name = url.Split('?', '#')[0].TrimEnd('/').Split('/').LastOrDefault();
        return string.IsNullOrWhiteSpace(name) ? url : "https://www.bilgeyismirzazada.com/uploads/" + name;
    }

    static string? LocalUploadPath(string url)
    {
        var name = url.Split('?', '#')[0].TrimEnd('/').Split('/').LastOrDefault();
        if (string.IsNullOrWhiteSpace(name)) return null;
        var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", name);
        return System.IO.File.Exists(path) ? path : null;
    }

    static string AvatarFor(string email)
    {
        var value = email.Trim().ToLowerInvariant();
        if (value.Length == 0) return "";
        var provider = value.EndsWith("@gmail.com") || value.EndsWith("@googlemail.com") ? "google/" : "";
        return "https://unavatar.io/" + provider + Uri.EscapeDataString(value);
    }

    // Tam müraciət siyahısı - ad, email, mesaj daxil olmaqla HƏSSAS DATA.
    // Yalnız Admin görə bilər. Müştəri öz sifarişini /mine/{clientId} ilə,
    // komanda üzvü öz təyinatlarını /staff ilə (filtrlənmiş halda) görür.
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<Inquiry>>> GetInquiries()
    {
        try
        {
            var list = await _context.Inquiries.OrderByDescending(i => i.CreatedAt).ToListAsync();
            var clients = await _context.ChatClients.ToListAsync();
            var byId = clients.ToDictionary(c => c.ClientId);
            var byEmail = clients
                .Where(c => !string.IsNullOrWhiteSpace(c.ClientEmail))
                .GroupBy(c => c.ClientEmail)
                .ToDictionary(g => g.Key, g => g.First());
            var dirtyTokens = false;
            foreach (var inquiry in list)
            {
                if (string.IsNullOrWhiteSpace(inquiry.TrackToken))
                {
                    inquiry.TrackToken = NewToken();
                    dirtyTokens = true;
                }
                ChatClient? owner = null;
                if (!string.IsNullOrEmpty(inquiry.ClientId) && byId.TryGetValue(inquiry.ClientId, out var found))
                    owner = found;
                else if (!string.IsNullOrWhiteSpace(inquiry.ClientEmail)
                    && byEmail.TryGetValue(inquiry.ClientEmail.Trim().ToLowerInvariant(), out var byMail))
                    owner = byMail;
                if (owner == null) continue;
                inquiry.ClientAvatarUrl = owner.AvatarUrl;
                if (string.IsNullOrWhiteSpace(inquiry.ClientName)) inquiry.ClientName = owner.ClientName;
                if (string.IsNullOrWhiteSpace(inquiry.ClientId)) inquiry.ClientId = owner.ClientId;
            }
            if (dirtyTokens) await _context.SaveChangesAsync();
            return list;
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Müraciətlər yüklənərkən xəta baş verdi.", error = ex.Message });
        }
    }

    // Müştərinin öz cihazında saxladığı clientId ilə YALNIZ ÖZ sifarişinin
    // vəziyyətini yoxlaması üçün açıq (auth tələb etməyən) endpoint.
    // Ad/email/mesaj kimi başqa müştərilərə aid həssas data qaytarılmır.
    [HttpGet("mine/{clientId}")]
    public async Task<IActionResult> GetMyInquiry(string clientId)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return BadRequest(new { message = "Müştəri ID mütləqdir." });
        }

        var owner = await _context.ChatClients.FirstOrDefaultAsync(c => c.ClientId == clientId);
        var email = owner?.ClientEmail?.Trim().ToLowerInvariant() ?? "";
        var inquiries = await _context.Inquiries
            .Where(i => i.ClientId == clientId || (email != "" && i.ClientEmail.ToLower() == email))
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new
            {
                i.Id,
                i.OrderNumber,
                i.Status,
                i.SelectedProjectTitle,
                i.Budget,
                i.Message,
                i.CreatedAt,
                i.DeliveredFileUrl,
                i.ClientId,
                i.ClientName,
                receiptUploaded = i.ReceiptPath != null && i.ReceiptPath != ""
            })
            .ToListAsync();

        return Ok(inquiries);
    }

    [HttpGet("accounts")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Accounts()
    {
        var list = await _context.ChatClients
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                clientId = c.ClientId,
                clientName = c.ClientName,
                clientEmail = c.ClientEmail,
                avatarUrl = c.AvatarUrl,
                createdAt = c.CreatedAt
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost("broadcast")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Broadcast([FromBody] BroadcastRequest? body)
    {
        body ??= new BroadcastRequest();
        var subject = (body.Subject ?? "").Trim();
        var text = (body.Message ?? "").Trim();
        if (subject.Length < 2 || text.Length < 2)
            return BadRequest(new { message = "Subject and message are required." });
        if (subject.Length > 140 || text.Length > 8000)
            return BadRequest(new { message = "Message is too long." });

        var emails = await _context.ChatClients
            .Where(c => c.ClientEmail != "")
            .Select(c => c.ClientEmail)
            .ToListAsync();
        var unique = emails
            .Select(e => (e ?? "").Trim().ToLowerInvariant())
            .Where(e => e.Contains('@'))
            .Distinct()
            .ToList();

        var html = "<div style=\"font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#1a1408\">"
            + WebUtility.HtmlEncode(text).Replace("\n", "<br>")
            + "<p style=\"margin-top:28px;color:#6b6254;font-size:12px\">Bilgeyis Mirzazada · bilgeyismirzazada.com</p></div>";

        var sent = 0;
        var failed = 0;
        foreach (var email in unique)
        {
            if (await SendHtmlMail(email, subject, html, text)) sent++;
            else failed++;
        }
        return Ok(new { sent, failed, total = unique.Count });
    }

    // Komanda üzvünün özünə təyin olunmuş işləri görməsi.
    // Müştərinin adı/emaili qəsdən qaytarılmır - əlaqə admində qalır.
    [HttpGet("staff")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> GetMyAssignments()
    {
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var inquiries = await _context.Inquiries
            .Where(i => i.AssignedStaffUsername == username)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new
            {
                i.Id,
                i.OrderNumber,
                i.SelectedProjectTitle,
                i.Budget,
                i.Message,
                i.Status,
                i.StaffFileUrl,
                i.StaffFileReady,
                i.ClientChatEnabled,
                i.CreatedAt
            })
            .ToListAsync();

        return Ok(inquiries);
    }

    // Admin: işi bir komanda üzvünə təyin edir (və ya boş username ilə təyinatı ləğv edir).
    [HttpPost("{id}/assign")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignToStaff(int id, [FromBody] AssignStaffModel model)
    {
        var inquiry = await _context.Inquiries.FindAsync(id);
        if (inquiry == null) return NotFound(new { message = "Sifariş tapılmadı." });

        if (!string.IsNullOrWhiteSpace(model.StaffUsername))
        {
            var staffExists = await _context.Users.AnyAsync(u => u.Username == model.StaffUsername && u.Role == "Staff");
            if (!staffExists) return BadRequest(new { message = "Komanda üzvü tapılmadı." });
        }

        inquiry.AssignedStaffUsername = string.IsNullOrWhiteSpace(model.StaffUsername) ? null : model.StaffUsername;
        await _context.SaveChangesAsync();

        if (!string.IsNullOrEmpty(inquiry.AssignedStaffUsername))
        {
            await _hubContext.Clients.Group("staff_" + inquiry.AssignedStaffUsername).SendAsync("ReceiveNewAssignment", inquiry.OrderNumber);
        }

        return Ok(new { message = "Təyinat yeniləndi.", assignedTo = inquiry.AssignedStaffUsername });
    }

    // Komanda üzvü: öz təyinatına faylı yükləyir. Fayl birbaşa müştəriyə YOX,
    // admin təsdiqinə göndərilir (approve-staff-file).
    [HttpPost("{id}/staff-deliver")]
    [Authorize(Roles = "Staff,Admin")]
    public async Task<IActionResult> StaffDeliverFile(int id, [FromForm] IFormFile file)
    {
        var inquiry = await _context.Inquiries.FindAsync(id);
        if (inquiry == null) return NotFound(new { message = "Sifariş tapılmadı." });

        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && inquiry.AssignedStaffUsername != username)
        {
            return Forbid();
        }

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Zəhmət olmasa fayl seçin." });

        try
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            inquiry.StaffFileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
            inquiry.StaffFileReady = true;
            await _context.SaveChangesAsync();

            // Admin panelinə bildiriş - komanda üzvündən fayl gəldi
            await _hubContext.Clients.All.SendAsync("ReceiveStaffFileReady", new { inquiry.Id, inquiry.OrderNumber, fileUrl = inquiry.StaffFileUrl });

            return Ok(new { message = "Fayl admin təsdiqinə göndərildi!", fileUrl = inquiry.StaffFileUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Fayl yüklənərkən xəta baş verdi.", error = ex.Message });
        }
    }

    // Admin: komanda üzvünün yüklədiyi faylı yoxlayıb müştəriyə təhvil verir.
    [HttpPost("{id}/approve-staff-file")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveStaffFile(int id)
    {
        var inquiry = await _context.Inquiries.FindAsync(id);
        if (inquiry == null) return NotFound(new { message = "Sifariş tapılmadı." });

        if (string.IsNullOrEmpty(inquiry.StaffFileUrl))
            return BadRequest(new { message = "Komanda üzvündən hələ fayl gəlməyib." });

        var local = LocalUploadPath(inquiry.StaffFileUrl);
        if (local == null) return BadRequest(new { message = "Komanda faylı serverdə tapılmadı." });

        var relative = "deliverables/" + NewToken() + SafeExt(local);
        var dest = PrivateFile(relative);
        Directory.CreateDirectory(Path.GetDirectoryName(dest)!);
        System.IO.File.Copy(local, dest, true);

        var result = await MarkPaymentPending(inquiry, relative, null);
        if (!result.ok) return BadRequest(new { message = result.message });
        return Ok(new { message = result.message, emailSent = result.emailed, status = inquiry.Status });
    }

    // Admin: komanda üzvü ilə müştərini birbaşa danışdırmaq üçün sifariş-çatını açır/bağlayır.
    // Bağlı olanda bütün əlaqə admin üzərindən keçir (default).
    [HttpPost("{id}/toggle-client-chat")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleClientChat(int id)
    {
        var inquiry = await _context.Inquiries.FindAsync(id);
        if (inquiry == null) return NotFound(new { message = "Sifariş tapılmadı." });

        inquiry.ClientChatEnabled = !inquiry.ClientChatEnabled;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Çat körpüsü yeniləndi.", clientChatEnabled = inquiry.ClientChatEnabled });
    }

    // Müştəri Qeydiyyatı (Unikal ClientId verilməsi üçün)
    [HttpPost("register")]
    public async Task<IActionResult> RegisterClient([FromBody] ClientRegisterDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.ClientName) || string.IsNullOrWhiteSpace(dto.ClientEmail))
        {
            return BadRequest(new { message = "Ad və email mütləqdir." });
        }

        try
        {
            var email = dto.ClientEmail.Trim().ToLowerInvariant();
            var name = dto.ClientName.Trim();
            var existing = await _context.ChatClients.FirstOrDefaultAsync(c => c.ClientEmail.ToLower() == email);
            if (existing != null)
            {
                existing.ClientName = name;
                if (string.IsNullOrWhiteSpace(existing.AvatarUrl))
                    existing.AvatarUrl = AvatarFor(email);
                await _context.SaveChangesAsync();
                return Ok(new
                {
                    message = "Bu email artıq qeydiyyatdadır.",
                    clientId = existing.ClientId,
                    clientName = existing.ClientName,
                    clientEmail = existing.ClientEmail,
                    avatarUrl = existing.AvatarUrl
                });
            }

            string clientId = "CLI-" + DateTime.Now.ToString("yyyyMMdd") + "-" + new Random().Next(1000, 9999);
            _context.ChatClients.Add(new ChatClient
            {
                ClientId = clientId,
                ClientName = name,
                ClientEmail = email,
                AvatarUrl = AvatarFor(email),
                CreatedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Qeydiyyat uğurla tamamlandı!",
                clientId,
                clientName = name,
                clientEmail = email,
                avatarUrl = AvatarFor(email)
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Qeydiyyat zamanı xəta baş verdi.", error = ex.Message });
        }
    }

    [HttpPost("client-login")]
    public async Task<IActionResult> LoginClient([FromBody] ClientLoginDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.ClientEmail))
        {
            return BadRequest(new { message = "Email mütləqdir." });
        }

        var email = dto.ClientEmail.Trim().ToLowerInvariant();
        var existing = await _context.ChatClients
            .FirstOrDefaultAsync(c => c.ClientEmail.ToLower() == email);

        if (existing == null)
        {
            var inquiry = await _context.Inquiries
                .Where(i => i.ClientEmail.ToLower() == email)
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();
            if (inquiry == null)
                return NotFound(new { message = "Bu email ilə hesab tapılmadı." });

            var clientId = string.IsNullOrWhiteSpace(inquiry.ClientId)
                ? "CLI-" + DateTime.Now.ToString("yyyyMMdd") + "-" + Random.Shared.Next(1000, 9999)
                : inquiry.ClientId;
            if (string.IsNullOrWhiteSpace(inquiry.ClientId))
                inquiry.ClientId = clientId;

            existing = await _context.ChatClients.FindAsync(clientId);
            if (existing == null)
            {
                existing = new ChatClient
                {
                    ClientId = clientId,
                    ClientName = string.IsNullOrWhiteSpace(inquiry.ClientName) ? email : inquiry.ClientName,
                    ClientEmail = email,
                    AvatarUrl = AvatarFor(email),
                    CreatedAt = DateTime.UtcNow,
                    LastMessageAt = DateTime.UtcNow
                };
                _context.ChatClients.Add(existing);
            }
            else if (string.IsNullOrWhiteSpace(existing.ClientEmail))
            {
                existing.ClientEmail = email;
            }
            await _context.SaveChangesAsync();
        }

        if (string.IsNullOrWhiteSpace(existing.AvatarUrl))
        {
            existing.AvatarUrl = AvatarFor(email);
            await _context.SaveChangesAsync();
        }

        if (!string.IsNullOrWhiteSpace(existing.PasswordHash))
        {
            var password = dto.Password ?? "";
            if (password.Length == 0 || !BCrypt.Net.BCrypt.Verify(password, existing.PasswordHash))
                return Unauthorized(new { message = "Wrong password.", passwordRequired = true });
        }

        return Ok(new
        {
            clientId = existing.ClientId,
            clientName = existing.ClientName,
            clientEmail = existing.ClientEmail,
            avatarUrl = existing.AvatarUrl
        });
    }

    [HttpPost("attachment")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UploadBriefFile([FromForm] IFormFile? file)
    {
        file ??= Request.Form.Files.GetFile("file") ?? Request.Form.Files.FirstOrDefault();
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Fayl seçilməyib." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".png", ".jpg", ".jpeg", ".svg", ".pdf" };
        if (!allowed.Contains(extension))
            return BadRequest(new { message = "Yalnız PNG, JPG, SVG və PDF qəbul olunur." });

        if (extension == ".svg")
        {
            using var reader = new StreamReader(file.OpenReadStream());
            var head = await reader.ReadToEndAsync();
            if (head.Contains("<script", StringComparison.OrdinalIgnoreCase) || head.Contains("javascript:", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Bu SVG faylı qəbul olunmur." });
        }

        var uploads = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploads);
        var fileName = $"{Guid.NewGuid()}{extension}";
        await using (var stream = new FileStream(Path.Combine(uploads, fileName), FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { url = $"/uploads/{fileName}" });
    }

    [HttpPost]
    public async Task<IActionResult> CreateInquiry([FromBody] Inquiry inquiry)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var owner = string.IsNullOrWhiteSpace(inquiry.ClientId)
                ? null
                : await _context.ChatClients.FirstOrDefaultAsync(c => c.ClientId == inquiry.ClientId);
            if (owner != null)
            {
                if (!string.IsNullOrWhiteSpace(owner.ClientName)) inquiry.ClientName = owner.ClientName;
                if (!string.IsNullOrWhiteSpace(owner.ClientEmail)) inquiry.ClientEmail = owner.ClientEmail;
                inquiry.ClientAvatarUrl = owner.AvatarUrl;
            }

            inquiry.OrderNumber = "ORD-" + DateTime.Now.ToString("yyyyMMdd") + "-" + new Random().Next(1000, 9999);
            inquiry.TrackToken = NewToken();
            inquiry.Status = "Yeni";
            inquiry.CreatedAt = DateTime.UtcNow;

            _context.Inquiries.Add(inquiry);
            await _context.SaveChangesAsync();

            // 1. SignalR ilə Admin panelə yeni sifariş gəldiyini xəbər veririk
            await _hubContext.Clients.All.SendAsync("ReceiveInquiryNotification", inquiry);

            // 2. RabbitMQ inteqrasiyası
            try
            {
                var rabbitHost = _configuration["RabbitMQ:Host"] ?? Environment.GetEnvironmentVariable("RabbitMQ__Host") ?? "localhost";
                var factory = new ConnectionFactory { HostName = rabbitHost };
                using var connection = await factory.CreateConnectionAsync();
                using var channel = await connection.CreateChannelAsync();

                await channel.QueueDeclareAsync(
                    queue: "client_inquiries",
                    durable: false,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null);

                var messageJson = JsonSerializer.Serialize(inquiry);
                var body = Encoding.UTF8.GetBytes(messageJson);

                await channel.BasicPublishAsync(
                    exchange: string.Empty,
                    routingKey: "client_inquiries",
                    body: body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"RabbitMQ Xətası: {ex.Message}");
            }

            return Ok(new { message = "Müraciətiniz qeydə alındı!", data = inquiry });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Sifariş yaradılarkən xəta baş verdi.", error = ex.Message });
        }
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateInquiryStatus(int id, [FromBody] StatusUpdateModel model)
    {
        if (model == null || string.IsNullOrEmpty(model.Status))
        {
            return BadRequest(new { message = "Status boş ola bilməz." });
        }

        try
        {
            var inquiry = await _context.Inquiries.FindAsync(id);
            if (inquiry == null) return NotFound(new { message = "Sifariş tapılmadı." });

            var allowed = new[] { "Yeni", "İcrada", "Ləğv edildi" };
            if (!allowed.Contains(model.Status))
                return BadRequest(new { message = "Ödəniş və tamamlanma yalnız təhvil düymələri ilə dəyişir." });
            if (inquiry.Status is "Tamamlandı" or "Ləğv edildi")
                return BadRequest(new { message = "Bu sifarişin statusu artıq bağlanıb." });

            inquiry.Status = model.Status;
            await _context.SaveChangesAsync();

            // SignalR ilə müştəriyə statusun dəyişdiyini xəbər veririk
            await _hubContext.Clients.Group(inquiry.OrderNumber).SendAsync("ReceiveStatusUpdate", inquiry.Status);

            return Ok(new { message = "Sifariş statusu yeniləndi!", status = inquiry.Status });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Status yenilənərkən xəta baş verdi.", error = ex.Message });
        }
    }

    [HttpPost("{id}/deliver")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(200_000_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 200_000_000)]
    public async Task<IActionResult> DeliverOrderFile(int id, [FromForm] IFormFile? file, [FromForm] string? link)
    {
        try
        {
            var inquiry = await _context.Inquiries.FindAsync(id);
            if (inquiry == null) return NotFound(new { message = "Sifariş tapılmadı." });
            if (inquiry.Status is "Tamamlandı" or "Ləğv edildi" or "Ödəniş gözlənilir")
                return BadRequest(new { message = "Bu mərhələdə təhvil mümkün deyil." });

            string? relative = null;
            if (file != null && file.Length > 0)
                relative = await SavePrivate(file, "deliverables");
            else if (!IsHttps(link))
                return BadRequest(new { message = "Fayl və ya https:// link lazımdır." });

            var result = await MarkPaymentPending(inquiry, relative, link);
            if (!result.ok) return BadRequest(new { message = result.message });
            return Ok(new { message = result.message, emailSent = result.emailed, status = inquiry.Status });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Fayl təhvil verilərkən xəta baş verdi.", error = ex.Message });
        }
    }

    [HttpGet("{id}/receipt")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdminReceipt(int id)
    {
        var inquiry = await _context.Inquiries.FindAsync(id);
        if (inquiry == null || string.IsNullOrEmpty(inquiry.ReceiptPath))
            return NotFound(new { message = "Çek yoxdur." });
        var full = PrivateFile(inquiry.ReceiptPath);
        if (!System.IO.File.Exists(full)) return NotFound(new { message = "Çek faylı tapılmadı." });
        var ext = Path.GetExtension(full).ToLowerInvariant();
        var type = ext switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".pdf" => "application/pdf",
            _ => "image/jpeg"
        };
        return PhysicalFile(full, type);
    }

    [HttpPost("{id}/confirm")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ConfirmPayment(int id)
    {
        var inquiry = await _context.Inquiries.FindAsync(id);
        if (inquiry == null) return NotFound(new { message = "Sifariş tapılmadı." });
        if (inquiry.Status != "Ödəniş gözlənilir")
            return BadRequest(new { message = "Təsdiq üçün status uyğun deyil." });
        if (string.IsNullOrEmpty(inquiry.ReceiptPath))
            return BadRequest(new { message = "Müştəri hələ çek yükləməyib." });

        inquiry.DownloadToken = NewToken();
        inquiry.DownloadExpires = DateTime.UtcNow.AddDays(30);
        inquiry.Status = "Tamamlandı";
        var downloadUrl = $"{SiteUrl}/api/inquiries/download/{inquiry.DownloadToken}";
        inquiry.DeliveredFileUrl = downloadUrl;
        await _context.SaveChangesAsync();

        string? attachment = null;
        if (!string.IsNullOrEmpty(inquiry.DeliverablePath))
        {
            var full = PrivateFile(inquiry.DeliverablePath);
            if (System.IO.File.Exists(full)) attachment = full;
        }
        var mailed = await SendDeliveredMail(inquiry, downloadUrl, attachment);
        await _hubContext.Clients.Group(inquiry.OrderNumber).SendAsync("ReceiveStatusUpdate", inquiry.Status);
        return Ok(new
        {
            message = mailed
                ? "Ödəniş təsdiqləndi və fayllar müştərinin emailinə göndərildi."
                : "Ödəniş təsdiqləndi, amma Gmail göndərilmədi.",
            emailSent = mailed,
            status = inquiry.Status
        });
    }

    [HttpGet("track/{token}")]
    public async Task<IActionResult> TrackOrder(string token)
    {
        var inquiry = await _context.Inquiries.FirstOrDefaultAsync(i => i.TrackToken == token);
        if (inquiry == null) return NotFound(new { message = "Sifariş tapılmadı." });
        var pending = inquiry.Status == "Ödəniş gözlənilir";
        string? download = null;
        if (inquiry.Status == "Tamamlandı")
        {
            if (!string.IsNullOrEmpty(inquiry.DownloadToken) && inquiry.DownloadExpires > DateTime.UtcNow)
                download = $"{SiteUrl}/api/inquiries/download/{inquiry.DownloadToken}";
            else if (!string.IsNullOrWhiteSpace(inquiry.DeliveredFileUrl))
                download = inquiry.DeliveredFileUrl;
        }
        return Ok(new
        {
            order_id = inquiry.OrderNumber,
            client_name = inquiry.ClientName,
            package_name = PackageName(inquiry),
            amount = inquiry.Budget,
            status = inquiry.Status,
            receipt_uploaded = inquiry.HasReceipt,
            payment = pending ? new { m10 = PayM10, card = PayCard, bank = PayBank } : null,
            download_url = download
        });
    }

    [HttpPost("track/{token}/receipt")]
    [RequestSizeLimit(20_000_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 20_000_000)]
    public async Task<IActionResult> UploadReceipt(string token, [FromForm] IFormFile? receipt)
    {
        var inquiry = await _context.Inquiries.FirstOrDefaultAsync(i => i.TrackToken == token);
        if (inquiry == null) return NotFound(new { message = "Sifariş tapılmadı." });
        if (inquiry.Status != "Ödəniş gözlənilir")
            return BadRequest(new { message = "Hazırda çek qəbul olunmur." });

        receipt ??= Request.Form.Files.GetFile("receipt") ?? Request.Form.Files.FirstOrDefault();
        if (receipt == null || receipt.Length == 0)
            return BadRequest(new { message = "JPG, PNG, WEBP və ya PDF (maks. 20MB) yükləyin." });
        var ext = SafeExt(receipt.FileName);
        if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp" or ".pdf"))
            return BadRequest(new { message = "JPG, PNG, WEBP və ya PDF (maks. 20MB) yükləyin." });

        var relative = await SavePrivate(receipt, "receipts");
        TryDeletePrivate(inquiry.ReceiptPath);
        inquiry.ReceiptPath = relative;
        inquiry.ReceiptAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _hubContext.Clients.All.SendAsync("ReceiveReceiptUploaded", new { inquiry.Id, inquiry.OrderNumber });
        await SendHtmlMail(
            SenderAddress(),
            $"Yeni ödəniş çeki: #{inquiry.OrderNumber}",
            MailShell($"<p>{Esc(inquiry.ClientName)} çek yüklədi. Admin paneldən yoxlayın.</p>"),
            $"{inquiry.ClientName} çek yüklədi. Admin paneldən yoxlayın.");

        return Ok(new { ok = true });
    }

    [HttpGet("download/{token}")]
    public async Task<IActionResult> DownloadDeliverable(string token)
    {
        var inquiry = await _context.Inquiries.FirstOrDefaultAsync(i => i.DownloadToken == token);
        if (inquiry == null || inquiry.Status != "Tamamlandı" || inquiry.DownloadExpires == null || inquiry.DownloadExpires < DateTime.UtcNow)
            return NotFound("Link etibarsızdır və ya müddəti bitib.");
        if (!string.IsNullOrEmpty(inquiry.DeliverablePath))
        {
            var full = PrivateFile(inquiry.DeliverablePath);
            if (!System.IO.File.Exists(full)) return NotFound("Fayl tapılmadı.");
            var ext = Path.GetExtension(full);
            return PhysicalFile(full, DownloadContentType(full), "delivery" + ext);
        }
        if (IsHttps(inquiry.DeliverableLink)) return Redirect(WithoutDisplaySize(inquiry.DeliverableLink!));
        return NotFound("Fayl tapılmadı.");
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteInquiry(int id)
    {
        try
        {
            var inquiry = await _context.Inquiries.FindAsync(id);
            if (inquiry == null)
            {
                return NotFound(new { message = "Sifariş / müraciət tapılmadı." });
            }

            string orderNumber = inquiry.OrderNumber;

            _context.Inquiries.Remove(inquiry);
            await _context.SaveChangesAsync();

            // SignalR ilə müştəriyə sifarişin admin tərəfindən silindiyini xəbər veririk
            if (!string.IsNullOrEmpty(orderNumber))
            {
                await _hubContext.Clients.Group(orderNumber).SendAsync("ReceiveOrderDeleted");
            }

            return Ok(new { message = "İş uğurla silindi!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Silinmə zamanı xəta baş verdi.", error = ex.Message });
        }
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateClientProfile([FromBody] ClientProfileDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.ClientId) || string.IsNullOrWhiteSpace(dto.ClientName) || string.IsNullOrWhiteSpace(dto.ClientEmail))
            return BadRequest(new { message = "Ad və email mütləqdir." });

        var client = await _context.ChatClients.FirstOrDefaultAsync(c => c.ClientId == dto.ClientId);
        if (client == null) return NotFound(new { message = "Hesab tapılmadı." });

        var email = dto.ClientEmail.Trim().ToLowerInvariant();
        var taken = await _context.ChatClients.AnyAsync(c => c.ClientEmail == email && c.ClientId != client.ClientId);
        if (taken) return BadRequest(new { message = "Bu email artıq istifadə olunur." });

        client.ClientName = dto.ClientName.Trim();
        client.ClientEmail = email;
        if (string.IsNullOrWhiteSpace(client.AvatarUrl) || client.AvatarUrl.Contains("unavatar.io"))
            client.AvatarUrl = AvatarFor(email);
        await _context.SaveChangesAsync();
        return Ok(new { clientId = client.ClientId, clientName = client.ClientName, clientEmail = client.ClientEmail, avatarUrl = client.AvatarUrl });
    }

    [HttpPost("avatar")]
    [RequestSizeLimit(8_000_000)]
    public async Task<IActionResult> UploadAvatar([FromForm] string clientId, IFormFile? file)
    {
        if (string.IsNullOrWhiteSpace(clientId)) return BadRequest(new { message = "Müştəri ID mütləqdir." });
        var client = await _context.ChatClients.FirstOrDefaultAsync(c => c.ClientId == clientId);
        if (client == null) return NotFound(new { message = "Hesab tapılmadı." });
        file ??= Request.Form.Files.FirstOrDefault();
        if (file == null || file.Length == 0) return BadRequest(new { message = "Şəkil seçilməyib." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".png" or ".jpg" or ".jpeg" or ".webp" or ".gif"))
            return BadRequest(new { message = "Yalnız şəkil yüklənə bilər." });

        var uploads = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploads);
        var fileName = Guid.NewGuid() + extension;
        await using (var stream = new FileStream(Path.Combine(uploads, fileName), FileMode.Create))
            await file.CopyToAsync(stream);

        client.AvatarUrl = $"/uploads/{fileName}";
        await _context.SaveChangesAsync();
        return Ok(new { avatarUrl = client.AvatarUrl, clientName = client.ClientName, clientEmail = client.ClientEmail, clientId = client.ClientId });
    }

    [HttpPost("likes")]
    public async Task<IActionResult> SaveLike([FromBody] ClientLikeDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.ClientId) || dto.ProjectId <= 0)
            return BadRequest(new { message = "Məlumat natamamdır." });
        var exists = await _context.ClientProjectLikes.AnyAsync(l => l.ClientId == dto.ClientId && l.ProjectId == dto.ProjectId);
        if (!exists)
        {
            _context.ClientProjectLikes.Add(new ClientProjectLike { ClientId = dto.ClientId, ProjectId = dto.ProjectId });
            await _context.SaveChangesAsync();
        }
        var ids = await _context.ClientProjectLikes.Where(l => l.ClientId == dto.ClientId).Select(l => l.ProjectId).ToListAsync();
        return Ok(ids);
    }

    [HttpGet("likes/{clientId}")]
    public async Task<IActionResult> GetLikes(string clientId)
    {
        var ids = await _context.ClientProjectLikes.Where(l => l.ClientId == clientId).Select(l => l.ProjectId).ToListAsync();
        return Ok(ids);
    }
}

public class StatusUpdateModel
{
    public string Status { get; set; } = string.Empty;
}

public class ClientRegisterDto
{
    public string ClientName { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
}

public class ClientLoginDto
{
    public string ClientEmail { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ClientProfileDto
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
}

public class ClientLikeDto
{
    public string ClientId { get; set; } = string.Empty;
    public int ProjectId { get; set; }
}

public class AssignStaffModel
{
    public string? StaffUsername { get; set; }
}

public class BroadcastRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
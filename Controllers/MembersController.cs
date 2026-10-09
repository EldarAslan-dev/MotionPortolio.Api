using System.Globalization;
using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotionPortfolio.Api.Data;
using MotionPortfolio.Api.Models;

namespace MotionPortfolio.Api.Controllers;

[ApiController]
[Route("api/members")]
[Authorize(Roles = "Admin")]
public class MembersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public MembersController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    const string SenderName = "Bilgeyis Mirzazada";

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var clients = await _context.ChatClients
            .Where(c => c.ClientEmail != "")
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var inquiries = await _context.Inquiries
            .Select(i => new { i.Id, i.ClientId, i.ClientEmail, i.OrderNumber, i.Status, i.Budget, i.SelectedProjectTitle, i.CreatedAt })
            .ToListAsync();
        var gifts = await _context.ClientGifts.OrderByDescending(g => g.CreatedAt).ToListAsync();

        return Ok(clients.Select(c =>
        {
            var mine = inquiries.Where(i =>
                i.ClientId == c.ClientId
                || (!string.IsNullOrWhiteSpace(c.ClientEmail) && string.Equals(i.ClientEmail, c.ClientEmail, StringComparison.OrdinalIgnoreCase)))
                .OrderByDescending(i => i.CreatedAt)
                .ToList();
            var paid = SumMoney(mine.Where(i => i.Status == "Tamamlandı").Select(i => i.Budget));
            return new
            {
                clientId = c.ClientId,
                name = c.ClientName,
                email = c.ClientEmail,
                createdAt = c.CreatedAt,
                hasPassword = !string.IsNullOrWhiteSpace(c.PasswordHash),
                orders = mine.Count,
                paid,
                ledger = mine.Select(i => new
                {
                    i.Id,
                    i.OrderNumber,
                    i.Status,
                    i.Budget,
                    title = i.SelectedProjectTitle,
                    i.CreatedAt
                }),
                gifts = gifts.Where(g => g.ClientId == c.ClientId).Select(g => new
                {
                    g.Id,
                    g.Kind,
                    g.Title,
                    g.Detail,
                    g.CreatedAt
                })
            };
        }));
    }

    static List<object> SumMoney(IEnumerable<string> budgets)
    {
        var map = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        foreach (var budget in budgets)
        {
            if (!TryMoney(budget, out var amount, out var currency)) continue;
            map[currency] = map.GetValueOrDefault(currency) + amount;
        }
        return map.Select(pair => (object)new { currency = pair.Key, amount = pair.Value }).ToList();
    }

    static bool TryMoney(string? raw, out decimal amount, out string currency)
    {
        amount = 0;
        currency = "";
        if (string.IsNullOrWhiteSpace(raw)) return false;
        var text = raw.Trim().ToUpperInvariant();
        currency = text.Contains("AZN") || text.Contains('₼') ? "AZN" : text.Contains("USD") || text.Contains('$') ? "USD" : "";
        var digits = new string(text.Where(c => char.IsDigit(c) || c == '.' || c == ',').ToArray()).Replace(',', '.');
        if (!decimal.TryParse(digits, NumberStyles.Number, CultureInfo.InvariantCulture, out amount)) return false;
        if (currency == "") currency = "USD";
        return true;
    }

    [HttpGet("mine/{clientId}")]
    [AllowAnonymous]
    public async Task<IActionResult> Mine(string clientId)
    {
        if (string.IsNullOrWhiteSpace(clientId)) return BadRequest();
        var gifts = await _context.ClientGifts
            .Where(g => g.ClientId == clientId)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new { g.Id, g.Kind, g.Title, g.Detail, g.CreatedAt })
            .ToListAsync();
        return Ok(gifts);
    }

    [HttpDelete("{clientId}")]
    public async Task<IActionResult> Delete(string clientId)
    {
        var client = await _context.ChatClients.FindAsync(clientId);
        if (client == null) return NotFound(new { message = "Hesab tapılmadı." });

        _context.Messages.RemoveRange(_context.Messages.Where(m => m.ClientId == clientId));
        _context.ClientProjectLikes.RemoveRange(_context.ClientProjectLikes.Where(l => l.ClientId == clientId));
        _context.ClientGifts.RemoveRange(_context.ClientGifts.Where(g => g.ClientId == clientId));
        _context.ChatClients.Remove(client);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Hesab silindi." });
    }

    public class PasswordDto
    {
        public string Password { get; set; } = "";
    }

    [HttpPut("{clientId}/password")]
    public async Task<IActionResult> SetPassword(string clientId, [FromBody] PasswordDto dto)
    {
        var password = (dto.Password ?? "").Trim();
        if (password.Length < 6) return BadRequest(new { message = "Password must be at least 6 characters." });
        var client = await _context.ChatClients.FindAsync(clientId);
        if (client == null) return NotFound(new { message = "Account not found." });
        client.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Password updated." });
    }

    public class GiftDto
    {
        public string Kind { get; set; } = "";
        public string Title { get; set; } = "";
        public string Detail { get; set; } = "";
    }

    [HttpPost("{clientId}/gifts")]
    public async Task<IActionResult> AddGift(string clientId, [FromBody] GiftDto dto)
    {
        var client = await _context.ChatClients.FindAsync(clientId);
        if (client == null) return NotFound(new { message = "Account not found." });
        var kind = (dto.Kind ?? "").Trim().ToLowerInvariant();
        if (kind is not ("discount" or "free"))
            return BadRequest(new { message = "Choose a discount or a free gift." });
        var title = (dto.Title ?? "").Trim();
        if (title.Length < 2 || title.Length > 120)
            return BadRequest(new { message = "Title must be 2–120 characters." });
        var detail = (dto.Detail ?? "").Trim();
        if (detail.Length > 500) detail = detail[..500];

        _context.ClientGifts.Add(new ClientGift
        {
            ClientId = clientId,
            Kind = kind,
            Title = title,
            Detail = detail,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var label = kind == "free" ? "Free gift" : "Discount";
        var html = $"""
            <!doctype html><html lang="en"><head><meta charset="utf-8"></head>
            <body style="margin:0;background:#ece8dd;font-family:Arial,Helvetica,sans-serif;color:#222">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
            <table role="presentation" width="100%" style="max-width:600px;background:#faf7ef;border-radius:12px">
            <tr><td style="background:#16130e;color:#f1ead8;padding:22px 32px;font-size:18px">{WebUtility.HtmlEncode(SenderName)}</td></tr>
            <tr><td style="padding:32px;font-size:15px;line-height:1.65">
            <p>Hello <b>{WebUtility.HtmlEncode(client.ClientName)}</b>,</p>
            <p>A {WebUtility.HtmlEncode(label.ToLowerInvariant())} is waiting for you: <b>{WebUtility.HtmlEncode(title)}</b></p>
            {(detail.Length == 0 ? "" : $"<p>{WebUtility.HtmlEncode(detail)}</p>")}
            <p>You will also see it on your account page.</p>
            </td></tr></table></td></tr></table></body></html>
            """;
        var mailed = await SendHtmlMail(client.ClientEmail, $"{label}: {title}", html, $"{label}: {title}. {detail}");
        return Ok(new { message = mailed ? "Saved, and the email was sent." : "Saved. The email was not sent.", emailed = mailed });
    }

    [HttpDelete("{clientId}/gifts/{giftId:int}")]
    public async Task<IActionResult> RemoveGift(string clientId, int giftId)
    {
        var gift = await _context.ClientGifts.FirstOrDefaultAsync(g => g.Id == giftId && g.ClientId == clientId);
        if (gift == null) return NotFound(new { message = "Hədiyyə tapılmadı." });
        _context.ClientGifts.Remove(gift);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Hədiyyə silindi." });
    }

    public class BroadcastDto
    {
        public string Subject { get; set; } = "";
        public string Body { get; set; } = "";
    }

    [HttpPost("broadcast")]
    public async Task<IActionResult> Broadcast([FromBody] BroadcastDto dto)
    {
        var subject = (dto.Subject ?? "").Trim();
        var body = (dto.Body ?? "").Trim();
        if (subject.Length < 2 || subject.Length > 180)
            return BadRequest(new { message = "Mövzu 2–180 simvol olmalıdır." });
        if (body.Length < 2 || body.Length > 8000)
            return BadRequest(new { message = "Mətn 2–8000 simvol olmalıdır." });

        var emails = await _context.ChatClients
            .Where(c => c.ClientEmail != "")
            .Select(c => c.ClientEmail)
            .ToListAsync();
        var unique = emails
            .Select(e => e.Trim())
            .Where(e => e.Contains('@'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (unique.Count == 0)
            return BadRequest(new { message = "E-poçtu olan hesab yoxdur." });

        var htmlBody = string.Join("<br>", body.Split('\n').Select(WebUtility.HtmlEncode));
        var html = $"""
            <!doctype html><html lang="az"><head><meta charset="utf-8"></head>
            <body style="margin:0;background:#ece8dd;font-family:Arial,Helvetica,sans-serif;color:#222">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#faf7ef;border-radius:12px;overflow:hidden">
            <tr><td style="background:#16130e;color:#f1ead8;padding:22px 32px;font-size:18px">{WebUtility.HtmlEncode(SenderName)}</td></tr>
            <tr><td style="padding:32px;font-size:15px;line-height:1.65">{htmlBody}</td></tr>
            <tr><td style="background:#16130e;color:#9a9078;padding:16px 32px;font-size:12px">Studiya elanı. Bu ünvan saytda qeydiyyatda olduğu üçün göndərilib.</td></tr>
            </table></td></tr></table></body></html>
            """;

        var sent = 0;
        var failed = 0;
        foreach (var email in unique)
        {
            if (await SendHtmlMail(email, subject, html, body)) sent++;
            else failed++;
        }

        return Ok(new { sent, failed, total = unique.Count });
    }

    string SenderAddress()
    {
        var from = _configuration["Gmail:Address"];
        return string.IsNullOrWhiteSpace(from) ? "bilgeyismirzazada@gmail.com" : from.Trim();
    }

    async Task<bool> SendHtmlMail(string to, string subject, string html, string text)
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
            message.To.Add(to);
            message.ReplyToList.Add(new MailAddress(from, SenderName));
            var htmlView = AlternateView.CreateAlternateViewFromString(html, Encoding.UTF8, MediaTypeNames.Text.Html);
            htmlView.ContentType.CharSet = "utf-8";
            message.AlternateViews.Add(htmlView);
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
}

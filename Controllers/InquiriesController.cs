using System.Security.Claims;
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

    // Tam müraciət siyahısı - ad, email, mesaj daxil olmaqla HƏSSAS DATA.
    // Yalnız Admin görə bilər. Müştəri öz sifarişini /mine/{clientId} ilə,
    // komanda üzvü öz təyinatlarını /staff ilə (filtrlənmiş halda) görür.
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<Inquiry>>> GetInquiries()
    {
        try
        {
            return await _context.Inquiries.OrderByDescending(i => i.CreatedAt).ToListAsync();
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

        var inquiry = await _context.Inquiries
            .Where(i => i.ClientId == clientId)
            .OrderByDescending(i => i.CreatedAt)
            .FirstOrDefaultAsync();

        if (inquiry == null) return NotFound();

        return Ok(new
        {
            clientId = inquiry.ClientId,
            orderNumber = inquiry.OrderNumber,
            status = inquiry.Status,
            deliveredFileUrl = inquiry.DeliveredFileUrl,
            clientChatEnabled = inquiry.ClientChatEnabled
        });
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

        inquiry.DeliveredFileUrl = inquiry.StaffFileUrl;
        inquiry.Status = "Tamamlandı";
        inquiry.StaffFileReady = false;
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group(inquiry.OrderNumber).SendAsync("ReceiveStatusUpdate", "Tamamlandı");

        return Ok(new { message = "Fayl təsdiqləndi və müştəriyə göndərildi!", fileUrl = inquiry.DeliveredFileUrl });
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
    public IActionResult RegisterClient([FromBody] ClientRegisterDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.ClientName) || string.IsNullOrWhiteSpace(dto.ClientEmail))
        {
            return BadRequest(new { message = "Ad və email mütləqdir." });
        }

        try
        {
            string clientId = "CLI-" + DateTime.Now.ToString("yyyyMMdd") + "-" + new Random().Next(1000, 9999);

            return Ok(new 
            { 
                message = "Qeydiyyat uğurla tamamlandı!", 
                clientId = clientId,
                clientName = dto.ClientName,
                clientEmail = dto.ClientEmail
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Qeydiyyat zamanı xəta baş verdi.", error = ex.Message });
        }
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
            inquiry.OrderNumber = "ORD-" + DateTime.Now.ToString("yyyyMMdd") + "-" + new Random().Next(1000, 9999);
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
    public async Task<IActionResult> DeliverOrderFile(int id, [FromForm] IFormFile file)
    {
        try
        {
            var inquiry = await _context.Inquiries.FindAsync(id);
            if (inquiry == null) return NotFound(new { message = "Sifariş tapılmadı." });

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Zəhmət olmasa təhvil veriləcək faylı seçin." });

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
            
            inquiry.DeliveredFileUrl = fileUrl;
            inquiry.Status = "Tamamlandı";
            await _context.SaveChangesAsync();

            // SignalR ilə müştəriyə sifarişin tamamlandığını və faylın gəldiyini xəbər veririk
            await _hubContext.Clients.Group(inquiry.OrderNumber).SendAsync("ReceiveStatusUpdate", "Tamamlandı");

            return Ok(new { message = "Fayl müştəriyə uğurla təhvil verildi!", fileUrl, status = inquiry.Status });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Fayl təhvil verilərkən xəta baş verdi.", error = ex.Message });
        }
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

public class AssignStaffModel
{
    public string? StaffUsername { get; set; }
}
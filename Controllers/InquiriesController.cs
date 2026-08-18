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

    [HttpGet]
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
    [Authorize]
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
    [Authorize]
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
    [Authorize]
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
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotionPortfolio.Api.Data;
using MotionPortfolio.Api.Models;

namespace MotionPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly AppDbContext _context;

    public MessagesController(AppDbContext context)
    {
        _context = context;
    }

    // Sifariş nömrəsinə görə mesajlar (əvvəlki funksionallıq saxlanılıb)
    [HttpGet("{orderNumber}")]
    public async Task<IActionResult> GetMessages(string orderNumber)
    {
        var messages = await _context.Messages
            .Where(m => m.OrderNumber == orderNumber)
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        return Ok(messages);
    }

    // Bir müştərinin bütün ümumi dəstək çatı tarixçəsi.
    // Həm müştərinin özü (saytda) həm də admin panel bunu çağırır.
    [HttpGet("client/{clientId}")]
    public async Task<IActionResult> GetClientMessages(string clientId)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return BadRequest(new { message = "Müştəri ID mütləqdir." });
        }

        var messages = await _context.Messages
            .Where(m => m.ClientId == clientId)
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        return Ok(messages);
    }

    // Admin panelindəki "Söhbətlər" siyahısı: bütün müştərilər + son mesaj.
    // ChatClients cədvəlindən oxunur ki, mesajlar silinsə belə müştəri siyahıda qalsın.
    [HttpGet("conversations")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetConversations()
    {
        var clients = await _context.ChatClients
            .OrderByDescending(c => c.LastMessageAt)
            .ToListAsync();

        var result = new List<object>();
        foreach (var c in clients)
        {
            var lastMessage = await _context.Messages
                .Where(m => m.ClientId == c.ClientId)
                .OrderByDescending(m => m.SentAt)
                .FirstOrDefaultAsync();

            result.Add(new
            {
                clientId = c.ClientId,
                clientName = c.ClientName,
                lastMessage = lastMessage?.Content,
                lastSender = lastMessage?.Sender,
                lastAt = lastMessage?.SentAt,
                hasMessages = lastMessage != null
            });
        }

        return Ok(result);
    }

    // Admin: bir müştərinin bütün mesajlarını silir, AMMA müştərinin özü
    // (ChatClients qeydi) saxlanılır ki, söhbət siyahısından itməsin və
    // yeni mesajlaşma davam edə bilsin.
    [HttpDelete("client/{clientId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ClearClientMessages(string clientId)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return BadRequest(new { message = "Müştəri ID mütləqdir." });
        }

        try
        {
            var messages = _context.Messages.Where(m => m.ClientId == clientId);
            _context.Messages.RemoveRange(messages);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Bütün mesajlar silindi. Müştəri qorunub saxlanıldı." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Mesajlar silinərkən xəta baş verdi.", error = ex.Message });
        }
    }

    // Admin: bir müştərini söhbətlər siyahısından TAMAMİLƏ silir
    // (həm mesajları, həm də ChatClients qeydini). Müştəri yenidən
    // mesaj yazarsa, söhbət avtomatik yenidən yaranacaq.
    [HttpDelete("client/{clientId}/full")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteClientCompletely(string clientId)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return BadRequest(new { message = "Müştəri ID mütləqdir." });
        }

        try
        {
            var messages = _context.Messages.Where(m => m.ClientId == clientId);
            _context.Messages.RemoveRange(messages);

            var chatClient = await _context.ChatClients.FindAsync(clientId);
            if (chatClient != null)
            {
                _context.ChatClients.Remove(chatClient);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Söhbət tamamilə silindi." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Söhbət silinərkən xəta baş verdi.", error = ex.Message });
        }
    }
}
namespace MotionPortfolio.Api.Models;

// Söhbət aparan hər müştərinin "şəxsiyyəti".
// DİQQƏT: Mesajlar (Message) silinsə belə, bu qeyd saxlanılır ki, müştəri
// admin panelindəki söhbətlər siyahısından itməsin.
public class ChatClient
{
    public string ClientId { get; set; } = string.Empty; // Əsas açar (məs: CLI-20260819-1234)
    public string ClientName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
}
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

    // Avtomatik salamlama mesajı bu müştəriyə göndərilibmi?
    // Bazada saxlanılır ki, admin paneli bağlı olsa, bir neçə tabda açıq olsa
    // və ya səhifə yenilənsə belə salamlama YALNIZ BİR DƏFƏ getsin.
    public bool AutoReplySent { get; set; }
}
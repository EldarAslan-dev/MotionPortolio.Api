public class Message
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty; // Hansı sifarişə aiddir
    public string Sender { get; set; } = string.Empty; // "Admin" və ya "Client"
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
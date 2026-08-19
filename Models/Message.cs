public class Message
{
    public int Id { get; set; }

    // Söhbətin aid olduğu müştəri (Ümumi dəstək çatı üçün əsas açar)
    public string ClientId { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;

    // Sifariş üzrə çat üçün (opsional, ümumi dəstək çatında istifadə olunmaya bilər)
    public string? OrderNumber { get; set; }

    public string Sender { get; set; } = string.Empty; // "Admin" və ya "Client"
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
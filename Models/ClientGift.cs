namespace MotionPortfolio.Api.Models;

public class ClientGift
{
    public int Id { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

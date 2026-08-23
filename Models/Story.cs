namespace MotionPortfolio.Api.Models;

public class Story
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string MediaUrl { get; set; } = string.Empty;
    public string MediaType { get; set; } = "image";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

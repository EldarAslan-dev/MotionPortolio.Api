namespace MotionPortfolio.Api.Models;

public class ProjectComment
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
namespace MotionPortfolio.Api.Models;

public class Project
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string CardImageUrl { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Yeni əlavələr (Like və Şərhlər üçün)
    public int LikesCount { get; set; } = 0;
    public List<ProjectComment> Comments { get; set; } = new();

    // Layihə case-study səhifəsi üçün əlavə, opsional sahələr.
    public string? Year { get; set; }
    public string? ProcessNotes { get; set; }
    public string GalleryJson { get; set; } = "[]";
}
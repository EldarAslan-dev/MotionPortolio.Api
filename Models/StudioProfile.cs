namespace MotionPortfolio.Api.Models;

public class StudioProfile
{
    public int Id { get; set; }
    public string DesignerName { get; set; } = "Motion Designer";
    public string Bio { get; set; } = "3D & Motion Artist Studio";
    public string AvatarUrl { get; set; } = "";
    public string AboutPhotoUrl { get; set; } = "";
    public string HeroGalleryJson { get; set; } = "[]";
    public string? HeroVideoUrl { get; set; }
    public string InstagramUrl { get; set; } = "";
    public string AnnouncementText { get; set; } = "";
    public bool ShowAnnouncement { get; set; } = true;
    public string NotesJson { get; set; } = "[]";
}
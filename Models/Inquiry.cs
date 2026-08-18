using System.ComponentModel.DataAnnotations;

namespace MotionPortfolio.Api.Models;

public class Inquiry
{
    public int Id { get; set; }

    // Yeni əlavə olunan unikal Müştəri ID sahəsi
    public string ClientId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Müştəri adı mütləqdir.")]
    public string ClientName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email mütləqdir.")]
    [EmailAddress(ErrorMessage = "Düzgün email formatı daxil edin.")]
    public string ClientEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "Büdcə mütləqdir.")]
    public string Budget { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mesaj mütləqdir.")]
    public string Message { get; set; } = string.Empty;

    public string? SelectedProjectTitle { get; set; } = "Ümumi Əməkdaşlıq";
    
    public string Status { get; set; } = "Yeni"; // Yeni, İcrada, Tamamlandı
    
    public string OrderNumber { get; set; } = string.Empty;
    public string? DeliveredFileUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
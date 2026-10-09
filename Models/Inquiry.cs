using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

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

    // ChatClient-dən gəlir, bazada ayrıca sütun deyil.
    [NotMapped]
    public string? ClientAvatarUrl { get; set; }

    [Required(ErrorMessage = "Büdcə mütləqdir.")]
    public string Budget { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mesaj mütləqdir.")]
    public string Message { get; set; } = string.Empty;

    public string? SelectedProjectTitle { get; set; } = "Ümumi Əməkdaşlıq";
    
    public string Status { get; set; } = "Yeni"; // Yeni, İcrada, Ödəniş gözlənilir, Tamamlandı, Ləğv edildi
    
    public string OrderNumber { get; set; } = string.Empty;
    public string? DeliveredFileUrl { get; set; }

    public string TrackToken { get; set; } = string.Empty;
    public string? DownloadToken { get; set; }
    public DateTime? DownloadExpires { get; set; }

    [JsonIgnore]
    public string? DeliverablePath { get; set; }
    public string? DeliverableLink { get; set; }

    [JsonIgnore]
    public string? ReceiptPath { get; set; }
    public DateTime? ReceiptAt { get; set; }

    [NotMapped]
    public bool HasReceipt => !string.IsNullOrEmpty(ReceiptPath);

    [NotMapped]
    public bool HasDeliverable => !string.IsNullOrEmpty(DeliverablePath) || !string.IsNullOrEmpty(DeliverableLink);

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // --- KOMANDA (STAFF) SİSTEMİ ---

    // İşin təyin olunduğu komanda üzvünün istifadəçi adı (User.Username).
    // Boşdursa, iş hələ heç kimə təyin edilməyib.
    public string? AssignedStaffUsername { get; set; }

    // Komanda üzvünün yüklədiyi fayl - birbaşa müştəriyə getmir,
    // əvvəlcə admin yoxlayıb təsdiqləməlidir (DeliveredFileUrl-ə köçürülür).
    public string? StaffFileUrl { get; set; }

    // Komanda üzvü faylı yükləyib və admin təsdiqini gözləyir.
    public bool StaffFileReady { get; set; }

    // Admin komanda üzvü ilə müştərini birbaşa çatda görüşdürübsə true olur.
    // Standart olaraq bağlıdır - bütün əlaqə admin üzərindən keçir.
    public bool ClientChatEnabled { get; set; }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotionPortfolio.Api.Data;
using MotionPortfolio.Api.Models;

namespace MotionPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProfileController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<StudioProfile>> GetProfile()
    {
        var profile = await _context.StudioProfiles.FirstOrDefaultAsync();
        if (profile == null)
        {
            profile = new StudioProfile();
            _context.StudioProfiles.Add(profile);
            await _context.SaveChangesAsync();
        }
        return Ok(profile);
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateProfile([FromBody] StudioProfile updated)
    {
        var profile = await _context.StudioProfiles.FirstOrDefaultAsync();
        if (profile == null)
        {
            _context.StudioProfiles.Add(updated);
        }
        else
        {
            profile.DesignerName = updated.DesignerName;
            profile.Bio = updated.Bio;
            
            // Yeni şəkil seçilibsə yeniləyir, seçilməyibsə köhnə şəkli saxlayır
            if (!string.IsNullOrEmpty(updated.AvatarUrl))
            {
                profile.AvatarUrl = updated.AvatarUrl;
            }

            if (updated.AboutPhotoUrl != null)
            {
                profile.AboutPhotoUrl = updated.AboutPhotoUrl;
            }

            if (updated.AboutTeaser != null)
            {
                profile.AboutTeaser = updated.AboutTeaser;
            }

            if (updated.AboutBody != null)
            {
                profile.AboutBody = updated.AboutBody;
            }

            if (updated.ToolsJson != null)
            {
                profile.ToolsJson = updated.ToolsJson;
            }

            if (updated.HeroGalleryJson != null)
            {
                profile.HeroGalleryJson = updated.HeroGalleryJson;
            }

            // string? — JSON-da sahə yoxdursa null qalır və mövcud video silinmir.
            // Admin "Sil" düyməsi açıq "" göndərir, o zaman təmizlənir.
            if (updated.HeroVideoUrl != null)
            {
                profile.HeroVideoUrl = updated.HeroVideoUrl;
            }

            profile.InstagramUrl = updated.InstagramUrl;
            profile.AnnouncementText = updated.AnnouncementText;
            profile.ShowAnnouncement = updated.ShowAnnouncement;
            profile.NotesJson = updated.NotesJson;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Studiya məlumatları uğurla yeniləndi!" });
    }
}
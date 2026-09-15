using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MotionPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public UploadController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

   [HttpPost]
[Authorize(Roles = "Admin")]
[RequestSizeLimit(500_000_000)] // məs. 500 MB
public async Task<IActionResult> UploadVideo(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Fayl seçilməyib.");

        // Yalnız video və media formatlarına icazə veririk
        var allowedExtensions = new[] { ".mp4", ".mov", ".webm", ".png", ".jpg", ".jpeg" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
            return BadRequest("Yalnız video və şəkil faylları yüklənə bilər.");

        // wwwroot/uploads qovluğunu yaradırıq
        var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        // Təkrarlanmayan unikal fayl adı yaradırıq
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Brauzerin birbaşa oxuya biləcəyi URL qaytarırıq
        var fileUrl = $"/uploads/{uniqueFileName}";
        return Ok(new { url = fileUrl });
        
    }
    
}
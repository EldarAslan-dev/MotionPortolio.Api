using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotionPortfolio.Api.Data;
using MotionPortfolio.Api.Models;

namespace MotionPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProjectsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/projects (Bütün layihələri şərhləri ilə birlikdə gətirir)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
    {
        try
        {
            return await _context.Projects
                .Include(p => p.Comments)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Server xətası baş verdi." });
        }
    }

    // GET: api/projects/5 (Tək bir layihəni ID ilə gətirir)
    [HttpGet("{id}")]
    public async Task<ActionResult<Project>> GetProject(int id)
    {
        try
        {
            var project = await _context.Projects
                .Include(p => p.Comments)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
            {
                return NotFound(new { message = "Layihə tapılmadı." });
            }
            return project;
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Server xətası baş verdi." });
        }
    }

    // POST: api/projects (Yeni layihə əlavə edir - Yalnız Admin)
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Project>> CreateProject([FromBody] Project project)
    {
        var hasGalleryMedia = !string.IsNullOrEmpty(project?.GalleryJson) && project.GalleryJson.Trim() is not ("" or "[]" or "null");
        var hasCardImage = !string.IsNullOrEmpty(project?.CardImageUrl);
        if (project == null || string.IsNullOrEmpty(project.Title) || (string.IsNullOrEmpty(project.VideoUrl) && !hasGalleryMedia && !hasCardImage))
        {
            return BadRequest(new { message = "Layihə başlığı və ən azı bir media (video və ya şəkil) mütləq təmin edilməlidir." });
        }

        try
        {
            project.CreatedAt = DateTime.UtcNow;
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, new { message = "Layihə uğurla yaradıldı.", data = project });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Layihə yaradılarkən xəta baş verdi.", error = ex.Message });
        }
    }

    // DELETE: api/projects/5 (Yalnız Admin)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        try
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound(new { message = "Layihə tapılmadı." });
            }

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Layihə uğurla silindi." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Silinmə zamanı xəta baş verdi.", error = ex.Message });
        }
    }

    // PUT: api/projects/5 (Yalnız Admin)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] Project updatedProject)
    {
        if (updatedProject == null)
        {
            return BadRequest(new { message = "Məlumatlar yanlışdır." });
        }

        try
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                return NotFound(new { message = "Layihə tapılmadı." });
            }

            project.Title = !string.IsNullOrEmpty(updatedProject.Title) ? updatedProject.Title : project.Title;
            project.Category = !string.IsNullOrEmpty(updatedProject.Category) ? updatedProject.Category : project.Category;
            project.Description = !string.IsNullOrEmpty(updatedProject.Description) ? updatedProject.Description : project.Description;
            
            if (!string.IsNullOrEmpty(updatedProject.VideoUrl))
            {
                project.VideoUrl = updatedProject.VideoUrl;
            }

            if (updatedProject.Year != null)
            {
                project.Year = updatedProject.Year;
            }
            if (updatedProject.ProcessNotes != null)
            {
                project.ProcessNotes = updatedProject.ProcessNotes;
            }
            if (!string.IsNullOrEmpty(updatedProject.GalleryJson))
            {
                project.GalleryJson = updatedProject.GalleryJson;
            }

            if (updatedProject.CardImageUrl != null)
            {
                project.CardImageUrl = updatedProject.CardImageUrl;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Layihə uğurla yeniləndi!", data = project });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Yenilənmə zamanı xəta baş verdi.", error = ex.Message });
        }
    }

    // POST: api/projects/5/like (Layihəni bəyənmək üçün - Hər kəs yaza bilər)
    [HttpPost("{id}/like")]
    public async Task<IActionResult> LikeProject(int id)
    {
        try
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound(new { message = "Layihə tapılmadı." });

            project.LikesCount++;
            await _context.SaveChangesAsync();

            return Ok(new { likesCount = project.LikesCount });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Xəta baş verdi.", error = ex.Message });
        }
    }

    // POST: api/projects/5/comment (Layihəyə şərh yazmaq üçün - Təhlükəsizlik yoxlamaları ilə)
    [HttpPost("{id}/comment")]
    public async Task<IActionResult> AddComment(int id, [FromBody] ProjectCommentDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new { message = "Şərh məzmunu boş ola bilməz." });
        }

        try
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound(new { message = "Layihə tapılmadı." });

            var comment = new ProjectComment
            {
                ProjectId = id,
                AuthorName = string.IsNullOrWhiteSpace(dto.AuthorName) ? "Anonim" : dto.AuthorName.Trim(),
                Content = dto.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.ProjectComments.Add(comment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Şərh uğurla əlavə edildi.", data = comment });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Şərh əlavə edilərkən xəta baş verdi.", error = ex.Message });
        }
    }
}

public class ProjectCommentDto
{
    public string AuthorName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
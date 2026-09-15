using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotionPortfolio.Api.Data;
using MotionPortfolio.Api.Models;

namespace MotionPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public StoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Story>>> GetStories()
    {
        var stories = await _context.Stories
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
        return Ok(stories);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Story>> AddStory([FromBody] Story newItem)
    {
        if (string.IsNullOrEmpty(newItem.MediaUrl))
            return BadRequest("Media URL tələb olunur.");

        newItem.Id = 0;
        newItem.CreatedAt = DateTime.UtcNow;
        _context.Stories.Add(newItem);
        await _context.SaveChangesAsync();
        return Ok(newItem);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteStory(int id)
    {
        var story = await _context.Stories.FindAsync(id);
        if (story == null) return NotFound("Story tapılmadı.");

        _context.Stories.Remove(story);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Silindi" });
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MotionPortfolio.Api.Data;
using MotionPortfolio.Api.Models;

namespace MotionPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientLogosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClientLogosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClientLogo>>> GetAll()
    {
        var logos = await _context.ClientLogos
            .OrderBy(l => l.SortOrder)
            .ThenBy(l => l.Id)
            .ToListAsync();
        return Ok(logos);
    }

    public class OrderBody
    {
        public List<int> Ids { get; set; } = new();
    }

    [HttpPut("order")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reorder([FromBody] OrderBody body)
    {
        if (body?.Ids == null || body.Ids.Count == 0)
            return BadRequest(new { message = "Sıra boşdur." });
        var logos = await _context.ClientLogos.ToListAsync();
        for (var i = 0; i < body.Ids.Count; i++)
        {
            var logo = logos.FirstOrDefault(l => l.Id == body.Ids[i]);
            if (logo != null) logo.SortOrder = i;
        }
        await _context.SaveChangesAsync();
        return Ok(new { message = "Sıra yeniləndi." });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ClientLogo>> Create([FromBody] ClientLogo item)
    {
        if (item == null || string.IsNullOrWhiteSpace(item.Name))
        {
            return BadRequest(new { message = "Company name is required." });
        }

        item.Id = 0;
        if (item.SortOrder == 0)
        {
            item.SortOrder = await _context.ClientLogos.CountAsync();
        }

        _context.ClientLogos.Add(item);
        await _context.SaveChangesAsync();
        return Ok(item);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ClientLogo updated)
    {
        var logo = await _context.ClientLogos.FindAsync(id);
        if (logo == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(updated.Name))
        {
            logo.Name = updated.Name;
        }

        if (updated.LogoUrl != null)
        {
            logo.LogoUrl = updated.LogoUrl;
        }

        await _context.SaveChangesAsync();
        return Ok(logo);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var logo = await _context.ClientLogos.FindAsync(id);
        if (logo == null) return NotFound();

        _context.ClientLogos.Remove(logo);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Deleted" });
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MotionPortfolio.Api.Data;

[Route("api/[controller]")]
[ApiController]
public class TestimonialsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TestimonialsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public IActionResult CreateTestimonial([FromBody] Testimonial model)
    {
        if (model == null)
        {
            return BadRequest(new { message = "Məlumatlar yanlışdır." });
        }

        _context.Testimonials.Add(model);
        _context.SaveChanges();

        return Ok(new { message = "Rəy uğurla göndərildi!", success = true });
    }

    [HttpGet]
    public IActionResult GetTestimonials()
    {
        var testimonials = _context.Testimonials.ToList();
        return Ok(testimonials);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public IActionResult DeleteTestimonial(int id)
    {
        var testimonial = _context.Testimonials.Find(id);
        if (testimonial == null)
        {
            return NotFound(new { message = "Rəy tapılmadı." });
        }

        _context.Testimonials.Remove(testimonial);
        _context.SaveChanges();

        return Ok(new { message = "Rəy uğurla silindi!" });
    }
}
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MotionPortfolio.Api.Data;
using MotionPortfolio.Api.Models;

namespace MotionPortfolio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    // İlk Admin Hesabı yaratmaq üçün köməkçi endpoint (Test məqsədli)
    [HttpPost("register-admin")]
    public async Task<IActionResult> RegisterAdmin([FromBody] LoginDto model)
    {
        if (await _context.Users.AnyAsync(u => u.Username == model.Username))
            return BadRequest("Bu istifadəçi adı artıq mövcuddur.");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);

        var user = new User
        {
            Username = model.Username,
            PasswordHash = passwordHash,
            Role = "Admin"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Admin uğurla yaradıldı!" });
    }

    // Login olub JWT Token almaq üçün
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == model.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash))
            return Unauthorized("İstifadəçi adı və ya şifrə yanlışdır.");

        // JWT Token yaradılması
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "super_secret_key_motion_portfolio_2026_secure");
        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        return Ok(new { token = tokenString, message = "Uğurla daxil olundu!" });
    }

    // Admin Şifrəsinin Dəyişdirilməsi Endpoint-i
    [HttpPost("change-password")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest model)
    {
        // Hazırda daxil olmuş admin istifadəçisini tapırıq
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);

        if (user == null)
            return NotFound("İstifadəçi tapılmadı.");

        // Köhnə şifrənin doğruluğunu yoxlayırıq
        if (!BCrypt.Net.BCrypt.Verify(model.OldPassword, user.PasswordHash))
            return BadRequest("Köhnə şifrə yanlışdır.");

        // Yeni şifrəni hash-ləyib bazaya yazırıq
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Şifrə uğurla dəyişdirildi!" });
    }

    // --- KOMANDA (STAFF) İDARƏETMƏSİ (Yalnız Admin) ---

    // Yeni komanda üzvü hesabı yaradır. Bu istifadəçi "Staff" rolu ilə
    // yalnız team.html panelinə giriş əldə edir, admin panelinə yox.
    [HttpPost("staff")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateStaff([FromBody] LoginDto model)
    {
        if (string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
            return BadRequest(new { message = "İstifadəçi adı və şifrə mütləqdir." });

        if (await _context.Users.AnyAsync(u => u.Username == model.Username))
            return BadRequest(new { message = "Bu istifadəçi adı artıq mövcuddur." });

        var staff = new User
        {
            Username = model.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password),
            Role = "Staff"
        };

        _context.Users.Add(staff);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Komanda üzvü uğurla əlavə edildi!", id = staff.Id, username = staff.Username });
    }

    // Bütün komanda üzvlərinin siyahısı (təyinat üçün açılan siyahıda istifadə olunur).
    [HttpGet("staff")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetStaffList()
    {
        var staff = await _context.Users
            .Where(u => u.Role == "Staff")
            .Select(u => new { u.Id, u.Username })
            .ToListAsync();

        return Ok(staff);
    }

    // Komanda üzvünü tamamilə silir. Admin hesabları bu yolla silinə bilməz.
    [HttpDelete("staff/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteStaff(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null || user.Role != "Staff")
            return NotFound(new { message = "Komanda üzvü tapılmadı." });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Komanda üzvü silindi." });
    }
}

// Şifrə dəyişmək üçün tələb olunan model
public class ChangePasswordRequest
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
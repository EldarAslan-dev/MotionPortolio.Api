using System.Text;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MotionPortfolio.Api.Data;
using MotionPortfolio.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Verilənlər Bazası
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. JWT Authentication & Authorization
var jwtKey = builder.Configuration["Jwt:Key"] ?? "super_secret_key_motion_portfolio_2026_secure";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name
        };
    });
builder.Services.AddAuthorization();

// 3. Servislər, Controller-lər və SignalR
builder.Services.AddSingleton<MotionPortfolio.Api.Services.RabbitMqService>();
builder.Services.AddHostedService<MotionPortfolio.Api.Services.InquiryConsumerService>();
var configuredOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>();
var frontendOrigins = new[]
{
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
}.Concat(configuredOrigins).Distinct().ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy.WithOrigins(frontendOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddSignalR();
builder.Services.AddControllers();
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 500_000_000; // Kestrel limiti ilə eyni
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});
builder.Services.AddOpenApi();
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 500_000_000; // 500 MB
});

var app = builder.Build();

// Qlobal xəta idarəetməsi (Server səviyyəsində qoruma)
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = "Serverdə gözlənilməz xəta baş verdi. Zəhmət olmasa bir az sonra yenidən yoxlayın." });
    });
});

// Verilənlər Bazası və Cədvəllərin yoxlanması / yaradılması
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    bool connected = false;
    int retries = 15;
    while (retries > 0 && !connected)
    {
        try
        {
            db.Database.EnsureCreated();
            connected = true;
        }
        catch
        {
            retries--;
            Thread.Sleep(2000); // 2 saniyə gözləyib yenidən yoxlayır
        }
    }

    if (connected)
    {
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StudioProfiles' and xtype='U')
            CREATE TABLE StudioProfiles (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                DesignerName NVARCHAR(MAX) NOT NULL DEFAULT 'Motion Designer',
                Bio NVARCHAR(MAX) NOT NULL DEFAULT '3D & Motion Artist Studio',
                AvatarUrl NVARCHAR(MAX) NOT NULL DEFAULT '',
                InstagramUrl NVARCHAR(MAX) NOT NULL DEFAULT '',
                AnnouncementText NVARCHAR(MAX) NOT NULL DEFAULT '',
                ShowAnnouncement BIT NOT NULL DEFAULT 1,
                NotesJson NVARCHAR(MAX) NOT NULL DEFAULT '[]'
            );

            -- Story-lər cədvəlinin avtomatik yaradılması
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stories' and xtype='U')
            CREATE TABLE Stories (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                Title NVARCHAR(MAX) NOT NULL DEFAULT '',
                MediaUrl NVARCHAR(MAX) NOT NULL DEFAULT '',
                MediaType NVARCHAR(MAX) NOT NULL DEFAULT 'image',
                CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
            );

            -- Testimonials (Müştəri Rəyləri) cədvəlinin yaradılması
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Testimonials' and xtype='U')
            CREATE TABLE Testimonials (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                ClientName NVARCHAR(MAX) NOT NULL DEFAULT '',
                Company NVARCHAR(MAX) NOT NULL DEFAULT '',
                Comment NVARCHAR(MAX) NOT NULL DEFAULT '',
                Rating INT NOT NULL DEFAULT 5
            );

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'SelectedProjectTitle' AND Object_ID = Object_ID(N'Inquiries'))
            ALTER TABLE Inquiries ADD SelectedProjectTitle NVARCHAR(MAX) NULL;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'Status' AND Object_ID = Object_ID(N'Inquiries'))
            ALTER TABLE Inquiries ADD Status NVARCHAR(MAX) NOT NULL DEFAULT 'Yeni';

            -- Sifariş nömrəsi və təhvil verilən fayl üçün sütunlar
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'OrderNumber' AND Object_ID = Object_ID(N'Inquiries'))
            ALTER TABLE Inquiries ADD OrderNumber NVARCHAR(MAX) NOT NULL DEFAULT 'ORD-2026-001';

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'DeliveredFileUrl' AND Object_ID = Object_ID(N'Inquiries'))
            ALTER TABLE Inquiries ADD DeliveredFileUrl NVARCHAR(MAX) NULL;

            -- Komanda (staff) sistemi üçün sütunlar
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'AssignedStaffUsername' AND Object_ID = Object_ID(N'Inquiries'))
            ALTER TABLE Inquiries ADD AssignedStaffUsername NVARCHAR(200) NULL;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'StaffFileUrl' AND Object_ID = Object_ID(N'Inquiries'))
            ALTER TABLE Inquiries ADD StaffFileUrl NVARCHAR(MAX) NULL;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'StaffFileReady' AND Object_ID = Object_ID(N'Inquiries'))
            ALTER TABLE Inquiries ADD StaffFileReady BIT NOT NULL DEFAULT 0;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'ClientChatEnabled' AND Object_ID = Object_ID(N'Inquiries'))
            ALTER TABLE Inquiries ADD ClientChatEnabled BIT NOT NULL DEFAULT 0;

            -- Müştəri şəxsiyyəti cədvəli: mesajlar silinsə belə bu qalır,
            -- ona görə admin panelindəki söhbətlər siyahısından müştəri itmir
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatClients' and xtype='U')
            CREATE TABLE ChatClients (
                ClientId NVARCHAR(100) NOT NULL PRIMARY KEY,
                ClientName NVARCHAR(MAX) NOT NULL DEFAULT '',
                CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                LastMessageAt DATETIME2 NOT NULL DEFAULT GETDATE()
            );

            -- Avtomatik salamlamanın hər müştəriyə yalnız bir dəfə getməsi üçün bayraq
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'AutoReplySent' AND Object_ID = Object_ID(N'ChatClients'))
            ALTER TABLE ChatClients ADD AutoReplySent BIT NOT NULL DEFAULT 0;

            -- Ümumi dəstək çatının (offline mesajlaşma) mesajları
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Messages' and xtype='U')
            CREATE TABLE Messages (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                ClientId NVARCHAR(100) NOT NULL DEFAULT '',
                ClientName NVARCHAR(MAX) NOT NULL DEFAULT '',
                OrderNumber NVARCHAR(MAX) NULL,
                Sender NVARCHAR(50) NOT NULL DEFAULT '',
                Content NVARCHAR(MAX) NOT NULL DEFAULT '',
                SentAt DATETIME2 NOT NULL DEFAULT GETDATE()
            );

            -- Layihə case-study səhifəsi üçün opsional sütunlar
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'Year' AND Object_ID = Object_ID(N'Projects'))
            ALTER TABLE Projects ADD Year NVARCHAR(50) NULL;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'ProcessNotes' AND Object_ID = Object_ID(N'Projects'))
            ALTER TABLE Projects ADD ProcessNotes NVARCHAR(MAX) NULL;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'GalleryJson' AND Object_ID = Object_ID(N'Projects'))
            ALTER TABLE Projects ADD GalleryJson NVARCHAR(MAX) NOT NULL DEFAULT '[]';

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'HeroVideoUrl' AND Object_ID = Object_ID(N'StudioProfiles'))
            ALTER TABLE StudioProfiles ADD HeroVideoUrl NVARCHAR(MAX) NOT NULL DEFAULT '';

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'AboutPhotoUrl' AND Object_ID = Object_ID(N'StudioProfiles'))
            ALTER TABLE StudioProfiles ADD AboutPhotoUrl NVARCHAR(MAX) NOT NULL DEFAULT '';

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'AboutTeaser' AND Object_ID = Object_ID(N'StudioProfiles'))
            ALTER TABLE StudioProfiles ADD AboutTeaser NVARCHAR(MAX) NOT NULL DEFAULT '';

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'AboutBody' AND Object_ID = Object_ID(N'StudioProfiles'))
            ALTER TABLE StudioProfiles ADD AboutBody NVARCHAR(MAX) NOT NULL DEFAULT '';

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'ToolsJson' AND Object_ID = Object_ID(N'StudioProfiles'))
            ALTER TABLE StudioProfiles ADD ToolsJson NVARCHAR(MAX) NOT NULL DEFAULT '[]';

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'HeroGalleryJson' AND Object_ID = Object_ID(N'StudioProfiles'))
            ALTER TABLE StudioProfiles ADD HeroGalleryJson NVARCHAR(MAX) NOT NULL DEFAULT '[]';

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'CardImageUrl' AND Object_ID = Object_ID(N'Projects'))
            ALTER TABLE Projects ADD CardImageUrl NVARCHAR(MAX) NOT NULL DEFAULT '';

            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ClientLogos' and xtype='U')
            CREATE TABLE ClientLogos (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                Name NVARCHAR(MAX) NOT NULL DEFAULT '',
                LogoUrl NVARCHAR(MAX) NOT NULL DEFAULT '',
                SortOrder INT NOT NULL DEFAULT 0
            );
        ");

        // Köhnə müştərilər: onlara artıq admin cavabı gedibsə, salamlama
        // yenidən getməsin. (Ayrı sorğu, çünki yuxarıda sütun yeni əlavə olunur.)
        db.Database.ExecuteSqlRaw(@"
            UPDATE ChatClients
            SET AutoReplySent = 1
            WHERE AutoReplySent = 0
              AND EXISTS (SELECT 1 FROM Messages m
                          WHERE m.ClientId = ChatClients.ClientId AND m.Sender = 'Admin');
        ");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("frontend");
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var origin = ctx.Context.Request.Headers.Origin.ToString();
        if (string.IsNullOrEmpty(origin) || !frontendOrigins.Contains(origin)) return;
        ctx.Context.Response.Headers["Access-Control-Allow-Origin"] = origin;
        ctx.Context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
        ctx.Context.Response.Headers["Access-Control-Allow-Headers"] = "Range";
        ctx.Context.Response.Headers["Access-Control-Expose-Headers"] =
            "Accept-Ranges, Content-Encoding, Content-Length, Content-Range";
    }
});

// Sıralama vacibdir: Authentication əvvəl, sonra Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<MotionPortfolio.Api.Hubs.NotificationHub>("/notificationHub")
    .RequireCors("frontend");

// Avtomatik Admin Hesabının Yaradılması
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        if (db.Database.CanConnect())
        {
            db.Database.EnsureCreated();
            if (!db.Users.Any(u => u.Username == "admin"))
            {
                db.Users.Add(new User
                {
                    Username = "admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                    Role = "Admin"
                });
                db.SaveChanges();
            }

            if (!db.ClientLogos.Any())
            {
                var names = new[]
                {
                    "JFA Partnership", "VRM Group", "VNM Agency", "INVESTxBAKU",
                    "Magnific", "Ganja Park City", "Kormotech", "NAVA",
                    "Aslanov Group", "Unipoland"
                };
                for (var i = 0; i < names.Length; i++)
                {
                    db.ClientLogos.Add(new ClientLogo
                    {
                        Name = names[i],
                        LogoUrl = "",
                        SortOrder = i
                    });
                }
                db.SaveChanges();
            }
        }
    }
    catch (Exception)
    {
        // Bağlantı həmən qurulmasa ötürür
    }
}

app.Run();
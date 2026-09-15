using Microsoft.EntityFrameworkCore;
using MotionPortfolio.Api.Models;

namespace MotionPortfolio.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Inquiry> Inquiries => Set<Inquiry>();
    public DbSet<User> Users => Set<User>();
    public DbSet<StudioProfile> StudioProfiles { get; set; }
    public DbSet<Story> Stories { get; set; }
    public DbSet<Testimonial> Testimonials { get; set; }
    public DbSet<ClientLogo> ClientLogos { get; set; }
    public DbSet<ProjectComment> ProjectComments { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<ChatClient> ChatClients { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ChatClient>().HasKey(c => c.ClientId);
    }
}
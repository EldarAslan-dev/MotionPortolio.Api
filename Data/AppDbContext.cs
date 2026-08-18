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
    public DbSet<Testimonial> Testimonials { get; set; }
    public DbSet<ProjectComment> ProjectComments { get; set; }
}
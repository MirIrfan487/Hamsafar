using Matrimony.Application.Interfaces;
using Matrimony.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Persistence;

// The DbContext is our "window" to the database. Each DbSet becomes a table.
// IdentityDbContext adds the login tables (AspNetUsers, AspNetRoles, ...).
// It implements IAppDbContext, so the Application layer can use it without knowing about SQL Server.
public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser>(options), IAppDbContext
{
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<ProfilePhoto> ProfilePhotos => Set<ProfilePhoto>();
    public DbSet<PartnerPreference> PartnerPreferences => Set<PartnerPreference>();
    public DbSet<Interest> Interests => Set<Interest>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<Block> Blocks => Set<Block>();
    public DbSet<AdminAuditLog> AdminAuditLogs => Set<AdminAuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder); // keep this first: it configures the Identity tables

        // Loads every class in /Configurations that implements IEntityTypeConfiguration<T>
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}

using Matrimony.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Api.Data;

// The DbContext is our "window" to the database. Each DbSet becomes a table.
// IdentityDbContext adds the login tables (AspNetUsers, AspNetRoles, ...).
public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser>(options)
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

    // NOTE on delete rules:
    // SQL Server does not allow two cascade-delete paths to the same table.
    // Tables that point to Profiles TWICE (Interests, Blocks, Reports, ...) use
    // Restrict. When we build "delete my account", the service will remove
    // those rows first, in the right order.

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder); // keep this first: it configures the Identity tables

        // ---------- Profiles ----------
        builder.Entity<Profile>(e =>
        {
            // One user -> one profile. Deleting the user deletes the profile.
            e.HasOne(p => p.User)
             .WithOne(u => u.Profile)
             .HasForeignKey<Profile>(p => p.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.Property(p => p.UserId).HasMaxLength(450);
            e.HasIndex(p => p.UserId).IsUnique();

            // Text lengths (otherwise SQL Server uses nvarchar(max))
            e.Property(p => p.FirstName).HasMaxLength(50).IsRequired();
            e.Property(p => p.LastName).HasMaxLength(50);
            e.Property(p => p.Country).HasMaxLength(60).IsRequired();
            e.Property(p => p.State).HasMaxLength(60);
            e.Property(p => p.City).HasMaxLength(60).IsRequired();
            e.Property(p => p.Education).HasMaxLength(100);
            e.Property(p => p.Occupation).HasMaxLength(100);
            e.Property(p => p.MotherTongue).HasMaxLength(40);
            e.Property(p => p.AboutMe).HasMaxLength(2000);
            e.Property(p => p.RejectionReason).HasMaxLength(300);

            // Store enums as text
            e.Property(p => p.ProfileFor).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Gender).HasConversion<string>().HasMaxLength(10);
            e.Property(p => p.MaritalStatus).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Sect).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Religiosity).HasConversion<string>().HasMaxLength(30);
            e.Property(p => p.PhotoPrivacy).HasConversion<string>().HasMaxLength(30);
            e.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);

            // Indexes make search fast (we filter by these a lot)
            e.HasIndex(p => new { p.Status, p.Gender });
            e.HasIndex(p => p.City);
        });

        // ---------- ProfilePhotos ----------
        builder.Entity<ProfilePhoto>(e =>
        {
            e.HasOne(ph => ph.Profile)
             .WithMany(p => p.Photos)
             .HasForeignKey(ph => ph.ProfileId)
             .OnDelete(DeleteBehavior.Cascade);

            e.Property(ph => ph.FilePath).HasMaxLength(300).IsRequired();
            e.Property(ph => ph.Status).HasConversion<string>().HasMaxLength(20);
        });

        // ---------- PartnerPreferences ----------
        builder.Entity<PartnerPreference>(e =>
        {
            e.HasOne(pp => pp.Profile)
             .WithOne(p => p.PartnerPreference)
             .HasForeignKey<PartnerPreference>(pp => pp.ProfileId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(pp => pp.ProfileId).IsUnique();
            e.Property(pp => pp.Education).HasMaxLength(100);
            e.Property(pp => pp.Notes).HasMaxLength(500);

            e.ToTable(t => t.HasCheckConstraint("CK_PartnerPreferences_Age",
                "[AgeMin] >= 18 AND [AgeMax] >= [AgeMin]"));
        });

        // ---------- Interests ----------
        builder.Entity<Interest>(e =>
        {
            e.HasOne(i => i.Sender).WithMany()
             .HasForeignKey(i => i.SenderProfileId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(i => i.Receiver).WithMany()
             .HasForeignKey(i => i.ReceiverProfileId).OnDelete(DeleteBehavior.Restrict);

            e.Property(i => i.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(i => i.Note).HasMaxLength(300);

            // Only one interest from A to B
            e.HasIndex(i => new { i.SenderProfileId, i.ReceiverProfileId }).IsUnique();
            // Fast "interests I received" inbox
            e.HasIndex(i => new { i.ReceiverProfileId, i.Status });

            e.ToTable(t => t.HasCheckConstraint("CK_Interests_NotSelf",
                "[SenderProfileId] <> [ReceiverProfileId]"));
        });

        // ---------- Conversations ----------
        builder.Entity<Conversation>(e =>
        {
            e.HasOne(c => c.Interest).WithMany()
             .HasForeignKey(c => c.InterestId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(c => c.Profile1).WithMany()
             .HasForeignKey(c => c.Profile1Id).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(c => c.Profile2).WithMany()
             .HasForeignKey(c => c.Profile2Id).OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(c => c.InterestId).IsUnique();
            e.HasIndex(c => new { c.Profile1Id, c.Profile2Id }).IsUnique();

            e.ToTable(t => t.HasCheckConstraint("CK_Conversations_Order",
                "[Profile1Id] < [Profile2Id]"));
        });

        // ---------- Messages ----------
        builder.Entity<Message>(e =>
        {
            // Deleting a conversation deletes its messages
            e.HasOne(m => m.Conversation)
             .WithMany(c => c.Messages)
             .HasForeignKey(m => m.ConversationId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(m => m.Sender).WithMany()
             .HasForeignKey(m => m.SenderProfileId).OnDelete(DeleteBehavior.Restrict);

            e.Property(m => m.Body).HasMaxLength(2000).IsRequired();

            // Load a chat's messages in time order quickly
            e.HasIndex(m => new { m.ConversationId, m.SentAtUtc });
        });

        // ---------- SubscriptionPlans ----------
        builder.Entity<SubscriptionPlan>(e =>
        {
            e.Property(sp => sp.Code).HasMaxLength(40).IsRequired();
            e.Property(sp => sp.Name).HasMaxLength(60).IsRequired();
            e.HasIndex(sp => sp.Code).IsUnique();

            // Starting plan (MVP has one paid plan). Price can be changed later.
            e.HasData(new SubscriptionPlan
            {
                Id = 1,
                Code = "PREMIUM_MONTHLY",
                Name = "Premium Monthly",
                PriceInPaise = 29900,       // ₹299
                DurationDays = 30,
                CanChat = true,
                CanViewContactDetails = true,
                InterestsPerMonth = null,   // unlimited
                IsActive = true
            });
        });

        // ---------- Payments ----------
        builder.Entity<Payment>(e =>
        {
            // Restrict: payment records are kept for accounts/tax, even if the user leaves
            e.HasOne(p => p.User).WithMany()
             .HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.Plan).WithMany()
             .HasForeignKey(p => p.PlanId).OnDelete(DeleteBehavior.Restrict);

            e.Property(p => p.UserId).HasMaxLength(450);
            e.Property(p => p.Currency).HasMaxLength(3).IsRequired();
            e.Property(p => p.RazorpayOrderId).HasMaxLength(50).IsRequired();
            e.Property(p => p.RazorpayPaymentId).HasMaxLength(50);
            e.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);

            e.HasIndex(p => p.RazorpayOrderId).IsUnique();
        });

        // ---------- Subscriptions ----------
        builder.Entity<Subscription>(e =>
        {
            e.HasOne(s => s.User).WithMany()
             .HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(s => s.Plan).WithMany()
             .HasForeignKey(s => s.PlanId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(s => s.Payment).WithMany()
             .HasForeignKey(s => s.PaymentId).OnDelete(DeleteBehavior.Restrict);

            e.Property(s => s.UserId).HasMaxLength(450);
            e.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);

            // Fast "does this user have premium right now?" check
            e.HasIndex(s => new { s.UserId, s.EndsAtUtc });
        });

        // ---------- Reports ----------
        builder.Entity<Report>(e =>
        {
            e.HasOne(r => r.Reporter).WithMany()
             .HasForeignKey(r => r.ReporterProfileId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(r => r.Reported).WithMany()
             .HasForeignKey(r => r.ReportedProfileId).OnDelete(DeleteBehavior.Restrict);

            e.Property(r => r.Reason).HasConversion<string>().HasMaxLength(30);
            e.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.Details).HasMaxLength(1000);
            e.Property(r => r.AdminNote).HasMaxLength(500);

            e.HasIndex(r => r.Status);   // admin panel: open reports first

            e.ToTable(t => t.HasCheckConstraint("CK_Reports_NotSelf",
                "[ReporterProfileId] <> [ReportedProfileId]"));
        });

        // ---------- Blocks ----------
        builder.Entity<Block>(e =>
        {
            e.HasOne(b => b.Blocker).WithMany()
             .HasForeignKey(b => b.BlockerProfileId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(b => b.Blocked).WithMany()
             .HasForeignKey(b => b.BlockedProfileId).OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(b => new { b.BlockerProfileId, b.BlockedProfileId }).IsUnique();

            e.ToTable(t => t.HasCheckConstraint("CK_Blocks_NotSelf",
                "[BlockerProfileId] <> [BlockedProfileId]"));
        });
    }
}

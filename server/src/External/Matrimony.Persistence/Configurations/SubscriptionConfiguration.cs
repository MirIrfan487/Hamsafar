using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: Subscriptions
public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> e)
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

        // One payment can create only ONE subscription (stops double activation by browser + webhook)
        e.HasIndex(s => s.PaymentId).IsUnique().HasFilter("[PaymentId] IS NOT NULL");
    }
}

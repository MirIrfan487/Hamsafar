using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: SubscriptionPlans
public class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> e)
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
    }
}

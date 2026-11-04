using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: Payments
public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> e)
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
    }
}

using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: Interests
// NOTE: SQL Server does not allow two cascade-delete paths to the same table, so tables
// that point to Profiles twice use Restrict. "Delete my account" will remove these rows in code.
public class InterestConfiguration : IEntityTypeConfiguration<Interest>
{
    public void Configure(EntityTypeBuilder<Interest> e)
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
    }
}

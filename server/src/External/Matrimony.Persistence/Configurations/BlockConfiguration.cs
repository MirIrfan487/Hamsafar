using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: Blocks
public class BlockConfiguration : IEntityTypeConfiguration<Block>
{
    public void Configure(EntityTypeBuilder<Block> e)
    {
        e.HasOne(b => b.Blocker).WithMany()
         .HasForeignKey(b => b.BlockerProfileId).OnDelete(DeleteBehavior.Restrict);
        e.HasOne(b => b.Blocked).WithMany()
         .HasForeignKey(b => b.BlockedProfileId).OnDelete(DeleteBehavior.Restrict);

        e.HasIndex(b => new { b.BlockerProfileId, b.BlockedProfileId }).IsUnique();

        e.ToTable(t => t.HasCheckConstraint("CK_Blocks_NotSelf",
            "[BlockerProfileId] <> [BlockedProfileId]"));
    }
}

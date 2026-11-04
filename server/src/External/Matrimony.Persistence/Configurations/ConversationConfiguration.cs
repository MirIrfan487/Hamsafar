using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: Conversations
public class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> e)
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
    }
}

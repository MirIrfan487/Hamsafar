using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: Messages
public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> e)
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
    }
}

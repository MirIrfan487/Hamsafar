using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: DeviceTokens
public class DeviceTokenConfiguration : IEntityTypeConfiguration<DeviceToken>
{
    public void Configure(EntityTypeBuilder<DeviceToken> e)
    {
        // Deleting an account removes its phones too (nothing else points at this table)
        e.HasOne(d => d.User).WithMany()
         .HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.Cascade);

        e.Property(d => d.Token).HasMaxLength(512).IsRequired();
        e.Property(d => d.Platform).HasConversion<string>().HasMaxLength(10);

        e.HasIndex(d => d.Token).IsUnique();   // one row per phone
        e.HasIndex(d => d.UserId);              // "all phones of this member" when sending
    }
}

using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: Profiles
public class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> e)
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
        e.Property(p => p.FatherOccupation).HasMaxLength(100);
        e.Property(p => p.MotherOccupation).HasMaxLength(100);
        e.Property(p => p.FamilyDetails).HasMaxLength(1000);

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
    }
}

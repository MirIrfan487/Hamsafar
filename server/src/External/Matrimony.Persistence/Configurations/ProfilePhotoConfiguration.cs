using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: ProfilePhotos
public class ProfilePhotoConfiguration : IEntityTypeConfiguration<ProfilePhoto>
{
    public void Configure(EntityTypeBuilder<ProfilePhoto> e)
    {
        // One profile -> many photos. Deleting the profile deletes its photos.
        e.HasOne(ph => ph.Profile)
         .WithMany(p => p.Photos)
         .HasForeignKey(ph => ph.ProfileId)
         .OnDelete(DeleteBehavior.Cascade);

        e.Property(ph => ph.FilePath).HasMaxLength(300).IsRequired();
        e.Property(ph => ph.Status).HasConversion<string>().HasMaxLength(20);
    }
}

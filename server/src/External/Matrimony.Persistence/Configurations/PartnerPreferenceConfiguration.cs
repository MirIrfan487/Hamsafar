using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: PartnerPreferences
public class PartnerPreferenceConfiguration : IEntityTypeConfiguration<PartnerPreference>
{
    public void Configure(EntityTypeBuilder<PartnerPreference> e)
    {
        e.HasOne(pp => pp.Profile)
         .WithOne(p => p.PartnerPreference)
         .HasForeignKey<PartnerPreference>(pp => pp.ProfileId)
         .OnDelete(DeleteBehavior.Cascade);

        e.HasIndex(pp => pp.ProfileId).IsUnique();
        e.Property(pp => pp.Education).HasMaxLength(100);
        e.Property(pp => pp.Notes).HasMaxLength(500);

        e.ToTable(t => t.HasCheckConstraint("CK_PartnerPreferences_Age",
            "[AgeMin] >= 18 AND [AgeMax] >= [AgeMin]"));
    }
}

using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: Reports
public class ReportConfiguration : IEntityTypeConfiguration<Report>
{
    public void Configure(EntityTypeBuilder<Report> e)
    {
        e.HasOne(r => r.Reporter).WithMany()
         .HasForeignKey(r => r.ReporterProfileId).OnDelete(DeleteBehavior.Restrict);
        e.HasOne(r => r.Reported).WithMany()
         .HasForeignKey(r => r.ReportedProfileId).OnDelete(DeleteBehavior.Restrict);

        e.Property(r => r.Reason).HasConversion<string>().HasMaxLength(30);
        e.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
        e.Property(r => r.Details).HasMaxLength(1000);
        e.Property(r => r.AdminNote).HasMaxLength(500);

        e.HasIndex(r => r.Status);   // admin panel: open reports first

        e.ToTable(t => t.HasCheckConstraint("CK_Reports_NotSelf",
            "[ReporterProfileId] <> [ReportedProfileId]"));
    }
}

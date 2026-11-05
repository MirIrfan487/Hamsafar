using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Matrimony.Persistence.Configurations;

// Table: AdminAuditLogs
public class AdminAuditLogConfiguration : IEntityTypeConfiguration<AdminAuditLog>
{
    public void Configure(EntityTypeBuilder<AdminAuditLog> e)
    {
        e.Property(a => a.AdminUserId).HasMaxLength(450).IsRequired();
        e.Property(a => a.AdminEmail).HasMaxLength(256).IsRequired();
        e.Property(a => a.Action).HasMaxLength(50).IsRequired();
        e.Property(a => a.TargetType).HasMaxLength(30).IsRequired();
        e.Property(a => a.TargetId).HasMaxLength(450).IsRequired();
        e.Property(a => a.Note).HasMaxLength(500);
        e.HasIndex(a => a.CreatedAtUtc);
    }
}

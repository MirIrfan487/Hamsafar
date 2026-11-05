namespace Matrimony.Domain.Entities;

// Every admin action is recorded here (table: AdminAuditLogs): who, what, on which record, when.
// No foreign keys on purpose: the log must stay even if the admin or the target is deleted later.
public class AdminAuditLog
{
    public long Id { get; set; }
    public string AdminUserId { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;      // e.g. "ApproveProfile"
    public string TargetType { get; set; } = string.Empty;  // e.g. "Profile"
    public string TargetId { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

using System.ComponentModel.DataAnnotations;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.DTOs;

// Who is doing an admin action (written to the activity log)
public record AdminActor(string UserId, string Email);

public record AdminStatsResponse(
    int TotalMembers, int NewMembersLast7Days,
    int PendingProfiles, int ApprovedProfiles,
    int PendingPhotos, int OpenReports,
    int ActivePremiumMembers, int RevenueThisMonthInPaise);

public record AdminPhotoItem(int Id, int ProfileId, string ProfileName, bool IsMain, PhotoStatus Status, DateTime UploadedAtUtc);

// Everything an admin needs to decide on a profile (including private fields)
public record AdminProfileReview(
    int Id, string UserEmail, DateTime CreatedAtUtc, DateTime UpdatedAtUtc, ProfileStatus Status,
    ProfileFor ProfileFor, string FirstName, string? LastName, Gender Gender, DateOnly DateOfBirth, int Age,
    MaritalStatus MaritalStatus, int? HeightCm, string Country, string? State, string City,
    string? Education, string? Occupation, Sect? Sect, Religiosity? Religiosity, string? MotherTongue, string? AboutMe,
    string? FatherOccupation, string? MotherOccupation, int? Brothers, int? Sisters, string? FamilyDetails,
    IReadOnlyList<AdminPhotoItem> Photos);

public class RejectRequest
{
    [Required, MaxLength(300)] public string Reason { get; set; } = string.Empty;   // shown to the member
}

public record AdminPersonRef(int ProfileId, string Name, string Email, string UserId, bool IsSuspended);

public record AdminReportItem(
    int Id, ReportReason Reason, string? Details, ReportStatus Status, DateTime CreatedAtUtc,
    string? AdminNote, AdminPersonRef Reporter, AdminPersonRef Reported, int ReportsAgainstThisMember);

public class ResolveReportRequest
{
    [Required, EnumDataType(typeof(ReportStatus))] public ReportStatus? Outcome { get; set; }   // ActionTaken or Dismissed
    [MaxLength(500)] public string? Note { get; set; }
    public bool SuspendReportedMember { get; set; }
}

public record AdminMemberItem(
    string UserId, string Email, int ProfileId, string FirstName, Gender Gender, string City,
    ProfileStatus ProfileStatus, bool IsSuspended, bool IsPremium, DateTime JoinedAtUtc, DateTime? LastActiveAtUtc);

public class SuspendRequest
{
    [MaxLength(500)] public string? Note { get; set; }
}

public record AuditLogItem(long Id, string AdminEmail, string Action, string TargetType, string TargetId, string? Note, DateTime CreatedAtUtc);

// ---------- Members: report & block ----------

public class ReportRequest
{
    [Required, EnumDataType(typeof(ReportReason))] public ReportReason? Reason { get; set; }
    [MaxLength(1000)] public string? Details { get; set; }
}

public record BlockedMemberResponse(int ProfileId, string DisplayName, string City, DateTime BlockedAtUtc);

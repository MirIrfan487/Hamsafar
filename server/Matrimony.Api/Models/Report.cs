namespace Matrimony.Api.Models;

// A member reports a suspicious profile (table: Reports). Admin reviews it.
public class Report
{
    public int Id { get; set; }

    public int ReporterProfileId { get; set; }
    public Profile Reporter { get; set; } = null!;

    public int ReportedProfileId { get; set; }
    public Profile Reported { get; set; } = null!;

    public ReportReason Reason { get; set; }
    public string? Details { get; set; }

    public ReportStatus Status { get; set; } = ReportStatus.Open;
    public string? AdminNote { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAtUtc { get; set; }
}

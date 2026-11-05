using System.ComponentModel.DataAnnotations;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.DTOs;

public enum InterestDirection
{
    Sent,       // I sent it
    Received    // they sent it to me
}

// Which list to show on the Interests page
public enum InterestBox
{
    Received,
    Sent,
    Connected   // accepted, in either direction
}

// POST /api/interests
public class SendInterestRequest
{
    [Required] public int? ReceiverProfileId { get; set; }
    [MaxLength(300)] public string? Note { get; set; }
}

public record InterestResponse(
    int Id,
    InterestDirection Direction,
    InterestStatus Status,
    string? Note,
    DateTime CreatedAtUtc,
    DateTime? RespondedAtUtc,
    ProfileCardResponse OtherProfile);

// Shown on a profile page: what is going on between me and this member
public record InterestBetweenResponse(int Id, InterestDirection Direction, InterestStatus Status);

public record InterestSummaryResponse(int ReceivedPending, int SentPending, int Connected);

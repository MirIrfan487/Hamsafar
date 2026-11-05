using Matrimony.Domain.Enums;

namespace Matrimony.Application.DTOs;

// The columns a card needs (one SQL query for a whole page of cards)
public class ProfileCardRow
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public bool ShowLastName { get; set; }
    public DateOnly DateOfBirth { get; set; }
    public int? HeightCm { get; set; }
    public string City { get; set; } = string.Empty;
    public string? State { get; set; }
    public string? Education { get; set; }
    public string? Occupation { get; set; }
    public MaritalStatus MaritalStatus { get; set; }
    public Sect? Sect { get; set; }
    public Religiosity? Religiosity { get; set; }
    public ProfileFor ProfileFor { get; set; }
    public PhotoPrivacy PhotoPrivacy { get; set; }
    public ProfileStatus Status { get; set; }
    public int? PhotoId { get; set; }   // best approved photo, if any
}

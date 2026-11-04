namespace Matrimony.Domain.Entities;

// What this person is looking for in a partner (table: PartnerPreferences).
// Used later for "recommended matches". One per profile.
public class PartnerPreference
{
    public int Id { get; set; }

    public int ProfileId { get; set; }
    public Profile Profile { get; set; } = null!;

    public int AgeMin { get; set; } = 18;
    public int AgeMax { get; set; } = 40;
    public int? HeightMinCm { get; set; }
    public int? HeightMaxCm { get; set; }

    // Multi-select lists. EF Core stores each list as a JSON array in one column,
    // e.g. ["NeverMarried","Divorced"]. An empty list means "any".
    public List<string> MaritalStatuses { get; set; } = new();
    public List<string> Sects { get; set; } = new();
    public List<string> Cities { get; set; } = new();

    public string? Education { get; set; }
    public string? Notes { get; set; }   // free text, e.g. "Should be willing to live in Srinagar"
}

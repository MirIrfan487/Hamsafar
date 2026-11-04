namespace Matrimony.Infrastructure.Authentication;

// Values from the "Jwt" section of appsettings.json.
// The Key is only in appsettings.Development.json for local testing.
// In production it must come from an environment variable (Jwt__Key) — never commit a real key.
public class JwtSettings
{
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 1440;
    public string Key { get; set; } = string.Empty;
}

using System.Security.Claims;
using System.Text;
using Matrimony.Api.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Matrimony.Api.Services;

// Creates the JWT (a signed "pass") that the user sends with every request after login.
// It contains who the user is (sub, email) and their roles. Nobody can change it
// without breaking the signature, because only the server knows the Key.
public class TokenService(IOptions<JwtSettings> options)
{
    public const string RoleClaim = "role";

    public (string Token, DateTime ExpiresAtUtc) CreateToken(AppUser user, IEnumerable<string> roles)
    {
        var settings = options.Value;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),          // user id
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())  // unique token id
        };
        claims.AddRange(roles.Select(r => new Claim(RoleClaim, r)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Key));
        var expires = DateTime.UtcNow.AddMinutes(settings.ExpiryMinutes);

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = settings.Issuer,
            Audience = settings.Audience,
            Expires = expires,
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        };

        var token = new JsonWebTokenHandler().CreateToken(descriptor);
        return (token, expires);
    }
}

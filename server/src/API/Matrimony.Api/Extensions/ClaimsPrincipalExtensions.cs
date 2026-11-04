using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Matrimony.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    // The logged-in user's id, read from the "sub" claim inside the JWT.
    // Usage in a controller:  var userId = User.GetUserId();
    public static string? GetUserId(this ClaimsPrincipal user) =>
        user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
}

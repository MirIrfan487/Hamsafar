using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Matrimony.Api.Hubs;

// Tells SignalR which user a connection belongs to: the "sub" claim (user id) from our JWT.
// This makes Clients.User(userId) work.
public class SubClaimUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection) =>
        connection.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
}

using Matrimony.Domain.Entities;

namespace Matrimony.Application.Interfaces;

// Creates the JWT after login. Implemented in Infrastructure (TokenService).
public interface ITokenService
{
    (string Token, DateTime ExpiresAtUtc) CreateToken(AppUser user, IEnumerable<string> roles);
}

using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Services;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.Interfaces.Services;

// Register, log in and read the current user. Implemented by AuthService (Application/Services).
public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request);
    Task<LoginResult> LoginAsync(LoginRequest request);
    Task<CurrentUserResponse?> GetCurrentUserAsync(string userId);
}

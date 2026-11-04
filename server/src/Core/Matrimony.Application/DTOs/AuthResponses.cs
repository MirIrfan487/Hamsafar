namespace Matrimony.Application.DTOs;

// What the API sends back after a successful login
public record LoginResponse(string Token, DateTime ExpiresAtUtc, CurrentUserResponse User);

// Basic info about the logged-in user (also returned by GET /api/auth/me)
public record CurrentUserResponse(string Id, string Email, string FirstName, IReadOnlyList<string> Roles);

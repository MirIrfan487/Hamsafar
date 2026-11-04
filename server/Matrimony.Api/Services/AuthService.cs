using Matrimony.Api.Data;
using Matrimony.Api.DTOs;
using Matrimony.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Api.Services;

// Result returned by the service to the controller
public record AuthResult(bool Succeeded, IReadOnlyList<string> Errors, string? UserId = null)
{
    public static AuthResult Ok(string userId) => new(true, [], userId);
    public static AuthResult Fail(params string[] errors) => new(false, errors);
}

public record LoginResult(bool Succeeded, string? Error, LoginResponse? Response = null)
{
    public static LoginResult Ok(LoginResponse response) => new(true, null, response);
    public static LoginResult Fail(string error) => new(false, error);
}

// Business logic for accounts. Controllers stay thin and call this.
public class AuthService(UserManager<AppUser> userManager, AppDbContext db, TokenService tokenService)
{
    public const int MinimumAge = 18;

    // Same message for "no such email" and "wrong password",
    // so nobody can use the login form to discover which emails are registered.
    private const string InvalidLogin = "Invalid email or password.";

    public async Task<AuthResult> RegisterAsync(RegisterRequest request)
    {
        // 1) Age check: the person the profile is FOR must be 18+
        var dob = request.DateOfBirth!.Value;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (dob > today.AddYears(-MinimumAge))
            return AuthResult.Fail($"The person must be at least {MinimumAge} years old.");
        if (dob < today.AddYears(-100))
            return AuthResult.Fail("Please enter a valid date of birth.");

        var email = request.Email.Trim().ToLowerInvariant();

        // 2) Everything below happens in ONE transaction:
        //    if creating the profile fails, the user account is rolled back too.
        await using var transaction = await db.Database.BeginTransactionAsync();

        // 3) Create the login account. UserManager hashes the password for us
        //    (we never store the plain password).
        var user = new AppUser { UserName = email, Email = email };
        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            return AuthResult.Fail(createResult.Errors.Select(e => e.Description).ToArray());

        // 4) Every new account is a normal Member
        var roleResult = await userManager.AddToRoleAsync(user, Roles.Member);
        if (!roleResult.Succeeded)
            return AuthResult.Fail(roleResult.Errors.Select(e => e.Description).ToArray());

        // 5) Create an empty Draft profile. The profile wizard (Phase 3) fills in the rest.
        db.Profiles.Add(new Profile
        {
            UserId = user.Id,
            FirstName = request.FirstName.Trim(),
            ProfileFor = request.ProfileFor!.Value,
            Gender = request.Gender!.Value,
            DateOfBirth = dob,
            Status = ProfileStatus.Draft
        });
        await db.SaveChangesAsync();

        await transaction.CommitAsync();
        return AuthResult.Ok(user.Id);
    }

    public async Task<LoginResult> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
            return LoginResult.Fail(InvalidLogin);

        // Locked after too many wrong passwords (settings in Program.cs)
        if (await userManager.IsLockedOutAsync(user))
            return LoginResult.Fail("Too many failed attempts. Please try again in 15 minutes.");

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            await userManager.AccessFailedAsync(user);   // counts the failed attempt
            return LoginResult.Fail(InvalidLogin);
        }

        // Only reveal "suspended" after the correct password was given
        if (user.IsSuspended)
            return LoginResult.Fail("This account has been suspended. Please contact support.");

        await userManager.ResetAccessFailedCountAsync(user);
        user.LastActiveAtUtc = DateTime.UtcNow;
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        var (token, expiresAtUtc) = tokenService.CreateToken(user, roles);
        var currentUser = await BuildCurrentUserAsync(user, roles);

        return LoginResult.Ok(new LoginResponse(token, expiresAtUtc, currentUser));
    }

    // Used by GET /api/auth/me
    public async Task<CurrentUserResponse?> GetCurrentUserAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null || user.IsSuspended)
            return null;

        var roles = await userManager.GetRolesAsync(user);
        return await BuildCurrentUserAsync(user, roles);
    }

    private async Task<CurrentUserResponse> BuildCurrentUserAsync(AppUser user, IList<string> roles)
    {
        var firstName = await db.Profiles
            .Where(p => p.UserId == user.Id)
            .Select(p => p.FirstName)
            .FirstOrDefaultAsync() ?? string.Empty;

        return new CurrentUserResponse(user.Id, user.Email ?? string.Empty, firstName, roles.ToList());
    }
}

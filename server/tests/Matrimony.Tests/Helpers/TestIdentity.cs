using Matrimony.Domain.Constants;
using Matrimony.Domain.Entities;
using Matrimony.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Matrimony.Tests.Helpers;

// ASP.NET Core Identity pieces for tests, working on the test database (no web app needed).
public static class TestIdentity
{
    // A real UserManager (the same class the API uses) on this context
    public static UserManager<AppUser> UserManager(AppDbContext db) =>
        new(new UserStore<AppUser>(db),
            Options.Create(new IdentityOptions()),
            new PasswordHasher<AppUser>(),
            [], [],
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            null!,   // services: not needed for what the tests call
            NullLogger<UserManager<AppUser>>.Instance);

    // An admin login account (admins have no profile), like SeedData.SeedAdminAsync makes
    public static async Task<AppUser> AddAdminAsync(AppDbContext db)
    {
        var role = db.Roles.FirstOrDefault(r => r.NormalizedName == "ADMIN");
        if (role is null)
        {
            role = new IdentityRole(Roles.Admin) { NormalizedName = "ADMIN" };
            db.Roles.Add(role);
        }

        var admin = new AppUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = $"admin{Guid.NewGuid():N}@test.local",
            UserName = $"admin{Guid.NewGuid():N}@test.local",
        };
        db.Users.Add(admin);
        db.UserRoles.Add(new IdentityUserRole<string> { UserId = admin.Id, RoleId = role.Id });
        await db.SaveChangesAsync();
        return admin;
    }
}

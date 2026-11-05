using Matrimony.Domain.Constants;
using Matrimony.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Matrimony.Persistence.Seed;

// Runs once at startup and creates anything the app needs to exist.
public static class SeedData
{
    // Creates the "Member" and "Admin" roles if they are missing (table: AspNetRoles)
    public static async Task SeedRolesAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var role in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }
    }

    // DEVELOPMENT ONLY: creates an admin login from the "SeedAdmin" settings, if it does not exist.
    // For production, give the Admin role to a real account with SQL instead (see CLAUDE.md).
    public static async Task SeedAdminAsync(IServiceProvider services, string email, string password)
    {
        using var scope = services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var admin = await userManager.FindByEmailAsync(email);
        if (admin is null)
        {
            admin = new AppUser { UserName = email, Email = email, EmailConfirmed = true };
            var created = await userManager.CreateAsync(admin, password);
            if (!created.Succeeded) return;
        }

        if (!await userManager.IsInRoleAsync(admin, Roles.Admin))
            await userManager.AddToRoleAsync(admin, Roles.Admin);
    }
}

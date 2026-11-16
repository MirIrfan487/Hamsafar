using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Matrimony.Persistence;

namespace Matrimony.Tests.Helpers;

// Creates members (login account + profile) with only the fields the rules care about.
public static class TestData
{
    private static int _counter;

    public static async Task<Profile> AddMemberAsync(
        AppDbContext db,
        Gender gender,
        ProfileStatus status = ProfileStatus.Approved,
        bool suspended = false,
        int age = 27)
    {
        var n = Interlocked.Increment(ref _counter);
        var user = new AppUser
        {
            Id = Guid.NewGuid().ToString(),
            Email = $"member{n}@test.local",
            UserName = $"member{n}@test.local",
            IsSuspended = suspended,
        };
        var profile = new Profile
        {
            User = user,
            UserId = user.Id,
            FirstName = $"Member{n}",
            Gender = gender,
            DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(-age),
            City = "Srinagar",
            Status = status,
        };
        db.Users.Add(user);
        db.Profiles.Add(profile);
        await db.SaveChangesAsync();
        return profile;
    }
}

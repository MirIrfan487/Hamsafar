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
        int age = 27,
        PhotoPrivacy photoPrivacy = PhotoPrivacy.AllMembers)
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
            PhotoPrivacy = photoPrivacy,
        };
        db.Users.Add(user);
        db.Profiles.Add(profile);
        await db.SaveChangesAsync();
        return profile;
    }

    // Gives a member the seeded PREMIUM_MONTHLY plan (Id 1: CanChat + CanViewContactDetails).
    // endsInDays below 0 makes a plan that has already ended.
    public static async Task AddPremiumAsync(AppDbContext db, Profile member, int endsInDays = 29,
        SubscriptionStatus status = SubscriptionStatus.Active)
    {
        var now = DateTime.UtcNow;
        db.Subscriptions.Add(new Subscription
        {
            UserId = member.UserId,
            PlanId = 1,
            StartsAtUtc = now.AddDays(endsInDays - 30),
            EndsAtUtc = now.AddDays(endsInDays),
            Status = status,
        });
        await db.SaveChangesAsync();
    }

    // A photo record for a profile (the file itself comes from FakePhotoStorage)
    public static async Task<ProfilePhoto> AddPhotoAsync(AppDbContext db, Profile owner,
        PhotoStatus status = PhotoStatus.Approved, bool isMain = true)
    {
        var photo = new ProfilePhoto { ProfileId = owner.Id, FilePath = $"{Guid.NewGuid():N}.jpg", Status = status, IsMain = isMain };
        db.ProfilePhotos.Add(photo);
        await db.SaveChangesAsync();
        return photo;
    }

    // Two members whose interest was accepted, with their conversation (smaller profile id first).
    public static async Task<Conversation> ConnectAsync(AppDbContext db, Profile sender, Profile receiver,
        InterestStatus status = InterestStatus.Accepted)
    {
        var interest = new Interest
        {
            SenderProfileId = sender.Id,
            ReceiverProfileId = receiver.Id,
            Status = status,
            RespondedAtUtc = DateTime.UtcNow,
        };
        var conversation = new Conversation
        {
            Interest = interest,
            Profile1Id = Math.Min(sender.Id, receiver.Id),
            Profile2Id = Math.Max(sender.Id, receiver.Id),
        };
        db.Interests.Add(interest);
        db.Conversations.Add(conversation);
        await db.SaveChangesAsync();
        return conversation;
    }
}

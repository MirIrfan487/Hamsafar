using Matrimony.Application.DTOs;
using Matrimony.Application.Services;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Matrimony.Persistence;
using Matrimony.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Tests.Application;

// What other members can learn about a profile (SearchService: search cards, profile page, contact details).
// Rules from CLAUDE.md: cards and profile pages never include email, phone, exact date of birth or a hidden
// last name; photo ids only when the viewer may see them; who appears at all (approved, opposite gender,
// not suspended, no block); email/phone only after an accepted interest AND with a contact-details plan.
public class ProfilePrivacyTests : IDisposable
{
    private readonly TestDatabase _database = new();

    public void Dispose() => _database.Dispose();

    private static SearchService NewService(AppDbContext db)
    {
        var cards = new ProfileCardService(db);
        return new SearchService(db, cards, new PremiumAccessService(db),
            new InterestService(db, cards, new FakeNotificationService()));
    }

    private async Task<ProfileDetailResponse?> ViewAsync(Profile viewer, Profile profile)
    {
        using var db = _database.NewContext();
        return await NewService(db).GetProfileAsync(viewer.UserId, profile.Id);
    }

    private async Task<IReadOnlyList<ProfileCardResponse>> SearchAsync(Profile viewer)
    {
        using var db = _database.NewContext();
        var result = await NewService(db).SearchAsync(viewer.UserId, new SearchRequest { PageSize = 48 });
        Assert.True(result.Succeeded, string.Join(", ", result.Errors));
        return result.Value!.Items;
    }

    // ---------- What the response types can contain at all ----------

    [Theory]
    [InlineData(typeof(ProfileCardResponse))]
    [InlineData(typeof(ProfileDetailResponse))]
    public void Cards_and_profile_pages_have_no_field_for_email_phone_or_date_of_birth(Type responseType)
    {
        var names = responseType.GetProperties().Select(p => p.Name.ToLowerInvariant()).ToList();
        Assert.DoesNotContain(names, n => n.Contains("email") || n.Contains("phone") || n.Contains("birth") || n.Contains("dob"));
    }

    // ---------- Profile page ----------

    [Fact]
    public async Task The_last_name_shows_only_if_the_member_chose_to_show_it()
    {
        Profile viewer, hidden, shown;
        using (var db = _database.NewContext())
        {
            viewer = await TestData.AddMemberAsync(db, Gender.Male);
            hidden = await TestData.AddMemberAsync(db, Gender.Female);
            shown = await TestData.AddMemberAsync(db, Gender.Female);
            hidden.LastName = "Secret";
            shown.LastName = "Khan";
            shown.ShowLastName = true;
            await db.SaveChangesAsync();
        }

        Assert.Equal(hidden.FirstName, (await ViewAsync(viewer, hidden))!.DisplayName);
        Assert.Equal($"{shown.FirstName} Khan", (await ViewAsync(viewer, shown))!.DisplayName);
        Assert.DoesNotContain(await SearchAsync(viewer), c => c.DisplayName.Contains("Secret"));
    }

    [Theory]
    [InlineData(ProfileStatus.Draft, false)]
    [InlineData(ProfileStatus.PendingApproval, false)]
    [InlineData(ProfileStatus.Rejected, false)]
    [InlineData(ProfileStatus.Approved, true)]   // suspended
    public async Task Unapproved_or_suspended_profiles_cannot_be_opened(ProfileStatus status, bool suspended)
    {
        Profile viewer, other;
        using (var db = _database.NewContext())
        {
            viewer = await TestData.AddMemberAsync(db, Gender.Male);
            other = await TestData.AddMemberAsync(db, Gender.Female, status, suspended);
        }

        Assert.Null(await ViewAsync(viewer, other));   // the API answers 404
    }

    [Fact]
    public async Task A_blocked_profile_cannot_be_opened()
    {
        Profile viewer, other;
        using (var db = _database.NewContext())
        {
            viewer = await TestData.AddMemberAsync(db, Gender.Male);
            other = await TestData.AddMemberAsync(db, Gender.Female);
            db.Blocks.Add(new Block { BlockerProfileId = other.Id, BlockedProfileId = viewer.Id });
            await db.SaveChangesAsync();
        }

        Assert.Null(await ViewAsync(viewer, other));
    }

    [Fact]
    public async Task Only_approved_photos_are_listed_on_the_profile_page()
    {
        Profile viewer, other;
        ProfilePhoto approved;
        using (var db = _database.NewContext())
        {
            viewer = await TestData.AddMemberAsync(db, Gender.Male);
            other = await TestData.AddMemberAsync(db, Gender.Female);
            approved = await TestData.AddPhotoAsync(db, other, PhotoStatus.Approved);
            await TestData.AddPhotoAsync(db, other, PhotoStatus.Pending, isMain: false);
            await TestData.AddPhotoAsync(db, other, PhotoStatus.Rejected, isMain: false);
        }

        Assert.Equal([approved.Id], (await ViewAsync(viewer, other))!.PhotoIds);
    }

    [Theory]
    [InlineData(PhotoPrivacy.AcceptedInterestsOnly, true)]   // locked: shows after an accepted interest
    [InlineData(PhotoPrivacy.Hidden, false)]                 // hidden: no hint that photos exist
    public async Task Private_photos_are_not_listed(PhotoPrivacy privacy, bool expectLocked)
    {
        Profile viewer, other;
        using (var db = _database.NewContext())
        {
            viewer = await TestData.AddMemberAsync(db, Gender.Male);
            other = await TestData.AddMemberAsync(db, Gender.Female, photoPrivacy: privacy);
            await TestData.AddPhotoAsync(db, other);
        }

        var page = (await ViewAsync(viewer, other))!;
        Assert.Empty(page.PhotoIds);
        Assert.Equal(expectLocked, page.PhotosLocked);

        var card = Assert.Single(await SearchAsync(viewer));
        Assert.Null(card.PhotoId);
        Assert.Equal(expectLocked, card.PhotoLocked);
    }

    [Fact]
    public async Task Accepted_interest_unlocks_AcceptedInterestsOnly_photos()
    {
        Profile viewer, other;
        ProfilePhoto photo;
        using (var db = _database.NewContext())
        {
            viewer = await TestData.AddMemberAsync(db, Gender.Male);
            other = await TestData.AddMemberAsync(db, Gender.Female, photoPrivacy: PhotoPrivacy.AcceptedInterestsOnly);
            photo = await TestData.AddPhotoAsync(db, other);
            await TestData.ConnectAsync(db, viewer, other);
        }

        Assert.Equal([photo.Id], (await ViewAsync(viewer, other))!.PhotoIds);
        Assert.Equal(photo.Id, Assert.Single(await SearchAsync(viewer)).PhotoId);
    }

    // ---------- Who appears in search ----------

    [Fact]
    public async Task Search_shows_only_approved_active_unblocked_members_of_the_other_gender()
    {
        Profile viewer, visible;
        using (var db = _database.NewContext())
        {
            viewer = await TestData.AddMemberAsync(db, Gender.Male);
            visible = await TestData.AddMemberAsync(db, Gender.Female);
            await TestData.AddMemberAsync(db, Gender.Male);                                  // same gender
            await TestData.AddMemberAsync(db, Gender.Female, ProfileStatus.PendingApproval); // not approved
            await TestData.AddMemberAsync(db, Gender.Female, suspended: true);               // suspended
            var blocker = await TestData.AddMemberAsync(db, Gender.Female);                  // blocked the viewer
            db.Blocks.Add(new Block { BlockerProfileId = blocker.Id, BlockedProfileId = viewer.Id });
            await db.SaveChangesAsync();
        }

        Assert.Equal([visible.Id], (await SearchAsync(viewer)).Select(c => c.Id));
    }

    // ---------- Contact details (email, phone) ----------

    private async Task<(Profile Viewer, Profile Other)> AddWithContactAsync()
    {
        using var db = _database.NewContext();
        var viewer = await TestData.AddMemberAsync(db, Gender.Male);
        var other = await TestData.AddMemberAsync(db, Gender.Female);
        var user = await db.Users.SingleAsync(u => u.Id == other.UserId);
        user.PhoneNumber = "+91 90000 00000";
        await db.SaveChangesAsync();
        return (viewer, other);
    }

    private async Task<Matrimony.Application.Common.ServiceResult<ContactDetailsResponse>> ContactAsync(Profile viewer, Profile other)
    {
        using var db = _database.NewContext();
        return await NewService(db).GetContactDetailsAsync(viewer.UserId, other.Id);
    }

    [Fact]
    public async Task Contact_details_need_an_accepted_interest()
    {
        var (viewer, other) = await AddWithContactAsync();
        using (var db = _database.NewContext())
            await TestData.AddPremiumAsync(db, viewer);   // Premium alone is not enough

        Assert.False((await ContactAsync(viewer, other)).Succeeded);
    }

    [Fact]
    public async Task Contact_details_need_Premium_even_when_connected()
    {
        var (viewer, other) = await AddWithContactAsync();
        using (var db = _database.NewContext())
            await TestData.ConnectAsync(db, viewer, other);

        var result = await ContactAsync(viewer, other);
        Assert.False(result.Succeeded);
        Assert.Contains("Premium", result.Errors[0]);
    }

    [Fact]
    public async Task Connected_Premium_members_get_email_and_phone()
    {
        var (viewer, other) = await AddWithContactAsync();
        using (var db = _database.NewContext())
        {
            await TestData.ConnectAsync(db, viewer, other);
            await TestData.AddPremiumAsync(db, viewer);
        }

        var result = await ContactAsync(viewer, other);

        Assert.True(result.Succeeded, string.Join(", ", result.Errors));
        Assert.EndsWith("@test.local", result.Value!.Email);
        Assert.Equal("+91 90000 00000", result.Value.PhoneNumber);
    }

    [Fact]
    public async Task A_block_after_connecting_hides_contact_details()
    {
        var (viewer, other) = await AddWithContactAsync();
        using (var db = _database.NewContext())
        {
            await TestData.ConnectAsync(db, viewer, other);
            await TestData.AddPremiumAsync(db, viewer);
            db.Blocks.Add(new Block { BlockerProfileId = other.Id, BlockedProfileId = viewer.Id });
            await db.SaveChangesAsync();
        }

        Assert.False((await ContactAsync(viewer, other)).Succeeded);
    }

    [Fact]
    public async Task A_suspended_members_contact_details_are_not_given_out()
    {
        var (viewer, other) = await AddWithContactAsync();
        using (var db = _database.NewContext())
        {
            await TestData.ConnectAsync(db, viewer, other);
            await TestData.AddPremiumAsync(db, viewer);
            (await db.Users.SingleAsync(u => u.Id == other.UserId)).IsSuspended = true;
            await db.SaveChangesAsync();
        }

        Assert.False((await ContactAsync(viewer, other)).Succeeded);
    }
}

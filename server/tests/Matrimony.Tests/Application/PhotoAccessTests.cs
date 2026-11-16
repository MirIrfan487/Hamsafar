using Matrimony.Application.Services;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Matrimony.Tests.Helpers;

namespace Matrimony.Tests.Application;

// Who may download a photo file (GET /api/photos/{id} -> PhotoService.OpenPhotoForViewerAsync).
// Rules from CLAUDE.md: owner and admins always; anyone else needs the photo AND the profile Approved,
// no block either way, and the owner's PhotoPrivacy to allow it
// (AllMembers / AcceptedInterestsOnly = an accepted interest in either direction / Hidden = nobody).
public class PhotoAccessTests : IDisposable
{
    private readonly TestDatabase _database = new();

    public void Dispose() => _database.Dispose();

    private async Task<bool> CanOpenAsync(string viewerUserId, ProfilePhoto photo, bool viewerIsAdmin = false)
    {
        using var db = _database.NewContext();
        await using var stream = await new PhotoService(db, new FakePhotoStorage())
            .OpenPhotoForViewerAsync(viewerUserId, viewerIsAdmin, photo.Id);
        return stream is not null;
    }

    // A woman with one photo, and a man who wants to see it
    private async Task<(Profile Owner, Profile Viewer, ProfilePhoto Photo)> SetupAsync(
        PhotoPrivacy privacy = PhotoPrivacy.AllMembers,
        PhotoStatus photoStatus = PhotoStatus.Approved,
        ProfileStatus ownerStatus = ProfileStatus.Approved)
    {
        using var db = _database.NewContext();
        var owner = await TestData.AddMemberAsync(db, Gender.Female, ownerStatus, photoPrivacy: privacy);
        var viewer = await TestData.AddMemberAsync(db, Gender.Male);
        var photo = await TestData.AddPhotoAsync(db, owner, photoStatus);
        return (owner, viewer, photo);
    }

    [Fact]
    public async Task Approved_photo_with_AllMembers_is_visible_to_members()
    {
        var (_, viewer, photo) = await SetupAsync();
        Assert.True(await CanOpenAsync(viewer.UserId, photo));
    }

    [Fact]
    public async Task The_owner_sees_her_own_photo_even_while_it_waits_for_approval()
    {
        var (owner, _, photo) = await SetupAsync(PhotoPrivacy.Hidden, PhotoStatus.Pending);
        Assert.True(await CanOpenAsync(owner.UserId, photo));
    }

    [Fact]
    public async Task An_admin_sees_pending_and_hidden_photos_to_review_them()
    {
        var (_, _, photo) = await SetupAsync(PhotoPrivacy.Hidden, PhotoStatus.Pending);
        Assert.True(await CanOpenAsync("admin-user-without-profile", photo, viewerIsAdmin: true));
    }

    [Theory]
    [InlineData(PhotoStatus.Pending)]
    [InlineData(PhotoStatus.Rejected)]
    public async Task Members_never_see_photos_that_are_not_approved(PhotoStatus status)
    {
        var (_, viewer, photo) = await SetupAsync(photoStatus: status);
        Assert.False(await CanOpenAsync(viewer.UserId, photo));
    }

    [Theory]
    [InlineData(ProfileStatus.Draft)]
    [InlineData(ProfileStatus.PendingApproval)]
    [InlineData(ProfileStatus.Rejected)]
    public async Task Members_never_see_photos_of_profiles_that_are_not_approved(ProfileStatus ownerStatus)
    {
        var (_, viewer, photo) = await SetupAsync(ownerStatus: ownerStatus);
        Assert.False(await CanOpenAsync(viewer.UserId, photo));
    }

    [Fact]
    public async Task AcceptedInterestsOnly_hides_the_photo_without_an_accepted_interest()
    {
        var (_, viewer, photo) = await SetupAsync(PhotoPrivacy.AcceptedInterestsOnly);
        Assert.False(await CanOpenAsync(viewer.UserId, photo));
    }

    [Theory]
    [InlineData(true)]    // the viewer sent the interest, she accepted
    [InlineData(false)]   // she sent it, the viewer accepted
    public async Task AcceptedInterestsOnly_shows_the_photo_after_an_accepted_interest_either_way(bool viewerSent)
    {
        var (owner, viewer, photo) = await SetupAsync(PhotoPrivacy.AcceptedInterestsOnly);
        using (var db = _database.NewContext())
            await (viewerSent ? TestData.ConnectAsync(db, viewer, owner) : TestData.ConnectAsync(db, owner, viewer));

        Assert.True(await CanOpenAsync(viewer.UserId, photo));
    }

    [Theory]
    [InlineData(InterestStatus.Pending)]
    [InlineData(InterestStatus.Rejected)]
    [InlineData(InterestStatus.Withdrawn)]
    public async Task AcceptedInterestsOnly_needs_the_interest_to_be_accepted(InterestStatus status)
    {
        var (owner, viewer, photo) = await SetupAsync(PhotoPrivacy.AcceptedInterestsOnly);
        using (var db = _database.NewContext())
            await TestData.ConnectAsync(db, viewer, owner, status);

        Assert.False(await CanOpenAsync(viewer.UserId, photo));
    }

    [Fact]
    public async Task Hidden_photos_stay_hidden_even_after_an_accepted_interest()
    {
        var (owner, viewer, photo) = await SetupAsync(PhotoPrivacy.Hidden);
        using (var db = _database.NewContext())
            await TestData.ConnectAsync(db, viewer, owner);

        Assert.False(await CanOpenAsync(viewer.UserId, photo));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task A_block_in_either_direction_hides_the_photo(bool ownerBlocked)
    {
        var (owner, viewer, photo) = await SetupAsync();
        using (var db = _database.NewContext())
        {
            db.Blocks.Add(ownerBlocked
                ? new Block { BlockerProfileId = owner.Id, BlockedProfileId = viewer.Id }
                : new Block { BlockerProfileId = viewer.Id, BlockedProfileId = owner.Id });
            await db.SaveChangesAsync();
        }

        Assert.False(await CanOpenAsync(viewer.UserId, photo));
    }

    [Fact]
    public async Task A_logged_in_account_without_a_profile_sees_nothing()
    {
        var (_, _, photo) = await SetupAsync();
        Assert.False(await CanOpenAsync("account-without-profile", photo));
    }
}

using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Services;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Matrimony.Persistence;
using Matrimony.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Tests.Application;

// Interest rules from CLAUDE.md (Phase 5): who may send, the daily limit, no resend after a "no",
// and that accepting opens a conversation. Each test gets its own empty in-memory database.
public class InterestServiceTests : IDisposable
{
    private readonly TestDatabase _database = new();
    private readonly FakeNotificationService _notifications = new();

    public void Dispose() => _database.Dispose();

    // A new service on a new context = one HTTP request
    private InterestService NewService(AppDbContext db) => new(db, new ProfileCardService(db), _notifications);

    private async Task<(Profile Man, Profile Woman)> AddCoupleAsync()
    {
        using var db = _database.NewContext();
        var man = await TestData.AddMemberAsync(db, Gender.Male);
        var woman = await TestData.AddMemberAsync(db, Gender.Female);
        return (man, woman);
    }

    private static SendInterestRequest To(Profile receiver) => new() { ReceiverProfileId = receiver.Id };

    // ---------- Sending ----------

    [Fact]
    public async Task Approved_member_can_send_to_approved_member_of_the_other_gender()
    {
        var (man, woman) = await AddCoupleAsync();

        using var db = _database.NewContext();
        var result = await NewService(db).SendAsync(man.UserId, To(woman));

        Assert.True(result.Succeeded, string.Join(", ", result.Errors));
        using var check = _database.NewContext();
        var saved = await check.Interests.SingleAsync();
        Assert.Equal(InterestStatus.Pending, saved.Status);
        Assert.Equal(woman.Id, saved.ReceiverProfileId);
    }

    [Fact]
    public async Task Sending_notifies_the_receiver_without_naming_the_sender()
    {
        var (man, woman) = await AddCoupleAsync();

        using var db = _database.NewContext();
        await NewService(db).SendAsync(man.UserId, To(woman));

        var (profileId, message) = Assert.Single(_notifications.ToProfiles);
        Assert.Equal(woman.Id, profileId);
        Assert.DoesNotContain(man.FirstName, message.Title + message.Body);   // lock-screen privacy
    }

    [Theory]
    [InlineData(ProfileStatus.Draft)]
    [InlineData(ProfileStatus.PendingApproval)]
    [InlineData(ProfileStatus.Rejected)]
    public async Task Sender_must_be_approved(ProfileStatus senderStatus)
    {
        Profile man, woman;
        using (var setup = _database.NewContext())
        {
            man = await TestData.AddMemberAsync(setup, Gender.Male, senderStatus);
            woman = await TestData.AddMemberAsync(setup, Gender.Female);
        }

        using var db = _database.NewContext();
        var result = await NewService(db).SendAsync(man.UserId, To(woman));

        Assert.False(result.Succeeded);
        Assert.Empty(_notifications.ToProfiles);
    }

    [Fact]
    public async Task Cannot_send_to_the_same_gender()
    {
        Profile man1, man2;
        using (var setup = _database.NewContext())
        {
            man1 = await TestData.AddMemberAsync(setup, Gender.Male);
            man2 = await TestData.AddMemberAsync(setup, Gender.Male);
        }

        using var db = _database.NewContext();
        Assert.False((await NewService(db).SendAsync(man1.UserId, To(man2))).Succeeded);
    }

    [Fact]
    public async Task Cannot_send_to_a_suspended_member()
    {
        Profile man, woman;
        using (var setup = _database.NewContext())
        {
            man = await TestData.AddMemberAsync(setup, Gender.Male);
            woman = await TestData.AddMemberAsync(setup, Gender.Female, suspended: true);
        }

        using var db = _database.NewContext();
        Assert.False((await NewService(db).SendAsync(man.UserId, To(woman))).Succeeded);
    }

    [Theory]
    [InlineData(true)]    // the sender blocked the receiver
    [InlineData(false)]   // the receiver blocked the sender
    public async Task Cannot_send_when_either_side_blocked_the_other(bool senderBlocked)
    {
        var (man, woman) = await AddCoupleAsync();
        using (var setup = _database.NewContext())
        {
            setup.Blocks.Add(senderBlocked
                ? new Block { BlockerProfileId = man.Id, BlockedProfileId = woman.Id }
                : new Block { BlockerProfileId = woman.Id, BlockedProfileId = man.Id });
            await setup.SaveChangesAsync();
        }

        using var db = _database.NewContext();
        Assert.False((await NewService(db).SendAsync(man.UserId, To(woman))).Succeeded);
    }

    [Fact]
    public async Task At_most_20_interests_in_24_hours()
    {
        Profile man;
        var women = new List<Profile>();
        using (var setup = _database.NewContext())
        {
            man = await TestData.AddMemberAsync(setup, Gender.Male);
            for (var i = 0; i < InterestService.DailySendLimit + 1; i++)
                women.Add(await TestData.AddMemberAsync(setup, Gender.Female));
        }

        for (var i = 0; i < InterestService.DailySendLimit; i++)
        {
            using var db = _database.NewContext();
            Assert.True((await NewService(db).SendAsync(man.UserId, To(women[i]))).Succeeded);
        }

        using var last = _database.NewContext();
        var result = await NewService(last).SendAsync(man.UserId, To(women[^1]));
        Assert.False(result.Succeeded);
        Assert.Contains("a day", result.Errors[0]);
    }

    [Fact]
    public async Task Cannot_send_again_after_being_declined()
    {
        var (man, woman) = await AddCoupleAsync();
        var interestId = await SendAsync(man, woman);
        await RespondAsync(woman, interestId, accept: false);

        using var db = _database.NewContext();
        Assert.False((await NewService(db).SendAsync(man.UserId, To(woman))).Succeeded);
    }

    [Fact]
    public async Task Cannot_send_when_the_other_side_already_sent_one()
    {
        var (man, woman) = await AddCoupleAsync();
        await SendAsync(woman, man);

        using var db = _database.NewContext();
        var result = await NewService(db).SendAsync(man.UserId, To(woman));
        Assert.False(result.Succeeded);
        Assert.Contains("already sent you an interest", result.Errors[0]);
    }

    // ---------- Accept / reject ----------

    [Fact]
    public async Task Accepting_opens_one_conversation_and_notifies_the_sender()
    {
        var (man, woman) = await AddCoupleAsync();
        var interestId = await SendAsync(man, woman);
        _notifications.ToProfiles.Clear();

        var result = await RespondAsync(woman, interestId, accept: true);

        Assert.True(result.Succeeded, string.Join(", ", result.Errors));
        using var check = _database.NewContext();
        var conversation = await check.Conversations.SingleAsync();
        Assert.True(conversation.Profile1Id < conversation.Profile2Id);   // stored smaller id first
        Assert.Equal(InterestStatus.Accepted, (await check.Interests.SingleAsync()).Status);
        Assert.Equal(man.Id, Assert.Single(_notifications.ToProfiles).ProfileId);
    }

    [Fact]
    public async Task Rejecting_opens_no_conversation_and_sends_no_notification()
    {
        var (man, woman) = await AddCoupleAsync();
        var interestId = await SendAsync(man, woman);
        _notifications.ToProfiles.Clear();

        Assert.True((await RespondAsync(woman, interestId, accept: false)).Succeeded);

        using var check = _database.NewContext();
        Assert.Empty(check.Conversations);
        Assert.Empty(_notifications.ToProfiles);
    }

    [Fact]
    public async Task Only_the_receiver_can_accept()
    {
        var (man, woman) = await AddCoupleAsync();
        var interestId = await SendAsync(man, woman);

        var result = await RespondAsync(man, interestId, accept: true);   // the sender tries

        Assert.False(result.Succeeded);
        using var check = _database.NewContext();
        Assert.Empty(check.Conversations);
    }

    // ---------- helpers ----------

    private async Task<int> SendAsync(Profile from, Profile to)
    {
        using var db = _database.NewContext();
        var result = await NewService(db).SendAsync(from.UserId, To(to));
        Assert.True(result.Succeeded, string.Join(", ", result.Errors));
        return await db.Interests
            .Where(i => i.SenderProfileId == from.Id && i.ReceiverProfileId == to.Id)
            .Select(i => i.Id)
            .SingleAsync();
    }

    private async Task<ServiceResult<InterestResponse>> RespondAsync(Profile who, int interestId, bool accept)
    {
        using var db = _database.NewContext();
        return await NewService(db).RespondAsync(who.UserId, interestId, accept);
    }
}

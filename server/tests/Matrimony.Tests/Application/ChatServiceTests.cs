using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Services;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Matrimony.Persistence;
using Matrimony.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Tests.Application;

// Chat rules from CLAUDE.md (Phases 6-7):
//  - chat only between members whose interest was accepted, no block, nobody suspended
//  - BOTH members need an active Premium plan to read or send; without it they see an unread count, never the text
//  - 30 messages a minute, max 2000 characters
//  - a push goes to the other member only when they are offline, and never contains the message text
public class ChatServiceTests : IDisposable
{
    private readonly TestDatabase _database = new();
    private readonly FakeNotificationService _notifications = new();
    private readonly FakePresenceTracker _presence = new();

    public void Dispose() => _database.Dispose();

    private ChatService NewService(AppDbContext db) =>
        new(db, _presence, new ProfileCardService(db), new PremiumAccessService(db), _notifications);

    // A connected couple with a conversation; who has Premium is up to each test
    private async Task<(Profile Man, Profile Woman, Conversation Chat)> AddConnectedCoupleAsync(
        bool manPremium = true, bool womanPremium = true)
    {
        using var db = _database.NewContext();
        var man = await TestData.AddMemberAsync(db, Gender.Male);
        var woman = await TestData.AddMemberAsync(db, Gender.Female);
        var chat = await TestData.ConnectAsync(db, man, woman);
        if (manPremium) await TestData.AddPremiumAsync(db, man);
        if (womanPremium) await TestData.AddPremiumAsync(db, woman);
        return (man, woman, chat);
    }

    private async Task<ServiceResult<SentMessageResult>> SendAsync(Profile from, Conversation chat, string body = "Assalamu alaikum")
    {
        using var db = _database.NewContext();
        return await NewService(db).SendAsync(from.UserId, chat.Id, body);
    }

    // ---------- Who can send ----------

    [Fact]
    public async Task Connected_members_who_both_have_Premium_can_send()
    {
        var (man, _, chat) = await AddConnectedCoupleAsync();

        var result = await SendAsync(man, chat, "  Assalamu alaikum  ");

        Assert.True(result.Succeeded, string.Join(", ", result.Errors));
        using var check = _database.NewContext();
        var saved = await check.Messages.SingleAsync();
        Assert.Equal("Assalamu alaikum", saved.Body);   // trimmed
        Assert.NotNull((await check.Conversations.SingleAsync()).LastMessageAtUtc);
    }

    [Theory]
    [InlineData(true, false)]    // only I have Premium
    [InlineData(false, true)]    // only the other member has it
    [InlineData(false, false)]   // nobody has it
    public async Task Both_members_need_Premium_to_send(bool manPremium, bool womanPremium)
    {
        var (man, _, chat) = await AddConnectedCoupleAsync(manPremium, womanPremium);

        var result = await SendAsync(man, chat);

        Assert.False(result.Succeeded);
        Assert.Equal(ErrorCodes.PremiumRequired, result.ErrorCode);   // the API answers 403
        using var check = _database.NewContext();
        Assert.Empty(check.Messages);
    }

    [Theory]
    [InlineData(-1, SubscriptionStatus.Active)]      // ended yesterday
    [InlineData(29, SubscriptionStatus.Cancelled)]   // dates fine, but cancelled
    public async Task An_ended_or_cancelled_plan_is_not_Premium(int endsInDays, SubscriptionStatus status)
    {
        var (man, woman, chat) = await AddConnectedCoupleAsync(manPremium: true, womanPremium: false);
        using (var setup = _database.NewContext())
            await TestData.AddPremiumAsync(setup, woman, endsInDays, status);

        Assert.Equal(ErrorCodes.PremiumRequired, (await SendAsync(man, chat)).ErrorCode);
    }

    [Fact]
    public async Task Someone_outside_the_conversation_gets_not_found()
    {
        var (_, _, chat) = await AddConnectedCoupleAsync();
        Profile stranger;
        using (var setup = _database.NewContext())
        {
            stranger = await TestData.AddMemberAsync(setup, Gender.Male);
            await TestData.AddPremiumAsync(setup, stranger);
        }

        var result = await SendAsync(stranger, chat);

        Assert.False(result.Succeeded);
        Assert.Equal(ErrorCodes.NotFound, result.ErrorCode);
    }

    [Fact]
    public async Task A_block_hides_the_conversation()
    {
        var (man, woman, chat) = await AddConnectedCoupleAsync();
        using (var setup = _database.NewContext())
        {
            setup.Blocks.Add(new Block { BlockerProfileId = woman.Id, BlockedProfileId = man.Id });
            await setup.SaveChangesAsync();
        }

        Assert.Equal(ErrorCodes.NotFound, (await SendAsync(man, chat)).ErrorCode);
        using var db = _database.NewContext();
        Assert.Empty((await NewService(db).ListAsync(man.UserId))!);
    }

    [Fact]
    public async Task Cannot_send_to_a_suspended_member()
    {
        var (man, woman, chat) = await AddConnectedCoupleAsync();
        using (var setup = _database.NewContext())
        {
            var user = await setup.Users.SingleAsync(u => u.Id == woman.UserId);
            user.IsSuspended = true;
            await setup.SaveChangesAsync();
        }

        var result = await SendAsync(man, chat);

        Assert.False(result.Succeeded);
        using var check = _database.NewContext();
        Assert.Empty(check.Messages);
    }

    // ---------- Message limits ----------

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Empty_messages_are_refused(string body)
    {
        var (man, _, chat) = await AddConnectedCoupleAsync();
        Assert.False((await SendAsync(man, chat, body)).Succeeded);
    }

    [Fact]
    public async Task Messages_longer_than_the_limit_are_refused()
    {
        var (man, _, chat) = await AddConnectedCoupleAsync();

        Assert.True((await SendAsync(man, chat, new string('a', ChatService.MaxMessageLength))).Succeeded);
        Assert.False((await SendAsync(man, chat, new string('a', ChatService.MaxMessageLength + 1))).Succeeded);
    }

    [Fact]
    public async Task At_most_30_messages_a_minute()
    {
        var (man, _, chat) = await AddConnectedCoupleAsync();

        for (var i = 0; i < ChatService.MaxMessagesPerMinute; i++)
            Assert.True((await SendAsync(man, chat, $"Message {i}")).Succeeded);

        var result = await SendAsync(man, chat, "One too many");
        Assert.False(result.Succeeded);
        Assert.Contains("too quickly", result.Errors[0]);
    }

    // ---------- Reading ----------

    [Fact]
    public async Task Without_Premium_on_both_sides_the_text_stays_hidden()
    {
        var (man, woman, chat) = await AddConnectedCoupleAsync();
        await SendAsync(man, chat, "Private words");

        // The woman's plan ends; the message is already there
        using (var setup = _database.NewContext())
        {
            foreach (var s in setup.Subscriptions.Where(s => s.UserId == woman.UserId)) s.Status = SubscriptionStatus.Expired;
            await setup.SaveChangesAsync();
        }

        using var db = _database.NewContext();
        var service = NewService(db);

        // Reading the messages: refused
        var messages = await service.GetMessagesAsync(woman.UserId, chat.Id, beforeId: null);
        Assert.Equal(ErrorCodes.PremiumRequired, messages.ErrorCode);

        // Chat list: she sees that something is waiting, not what it says
        var row = Assert.Single((await service.ListAsync(woman.UserId))!);
        Assert.Null(row.LastMessage);
        Assert.Equal(1, row.UnreadCount);
        Assert.False(row.CanSend);

        // "Mark as read" does nothing: she has not seen it
        Assert.Equal(0, (await service.MarkReadAsync(woman.UserId, chat.Id))!.Count);
        using var check = _database.NewContext();
        Assert.Null((await check.Messages.SingleAsync()).ReadAtUtc);
    }

    [Fact]
    public async Task With_Premium_on_both_sides_messages_can_be_read_oldest_first()
    {
        var (man, woman, chat) = await AddConnectedCoupleAsync();
        await SendAsync(man, chat, "First");
        await SendAsync(man, chat, "Second");

        using var db = _database.NewContext();
        var service = NewService(db);

        var messages = await service.GetMessagesAsync(woman.UserId, chat.Id, beforeId: null);
        Assert.True(messages.Succeeded);
        Assert.Equal(["First", "Second"], messages.Value!.Select(m => m.Body));

        var row = Assert.Single((await service.ListAsync(woman.UserId))!);
        Assert.Equal("Second", row.LastMessage);
        Assert.True(row.CanSend);

        Assert.Equal(2, (await service.MarkReadAsync(woman.UserId, chat.Id))!.Count);
        Assert.Equal(0, await service.GetUnreadCountAsync(woman.UserId));
    }

    // ---------- Push notifications ----------

    [Fact]
    public async Task An_offline_member_gets_a_push_without_the_message_text()
    {
        var (man, woman, chat) = await AddConnectedCoupleAsync();

        await SendAsync(man, chat, "Secret text");

        var (userId, message) = Assert.Single(_notifications.ToUsers);
        Assert.Equal(woman.UserId, userId);
        Assert.DoesNotContain("Secret text", message.Title + message.Body);
        Assert.Equal($"/chat/{chat.Id}", message.Url);
    }

    [Fact]
    public async Task An_online_member_gets_no_push()
    {
        var (man, woman, chat) = await AddConnectedCoupleAsync();
        _presence.Online.Add(woman.UserId);   // she has the app or website open: SignalR delivers it live

        await SendAsync(man, chat);

        Assert.Empty(_notifications.ToUsers);
    }
}

using Matrimony.Application.Interfaces;
using Matrimony.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Matrimony.Api.Hubs;

// The live connection between the browser and the server (URL: /hubs/chat).
// Messages are SENT through the REST API (ConversationsController); the hub PUSHES them to the browser.
//
// Events the browser listens for:
//   "ReceiveMessage"  (message)                     a new message in one of my conversations
//   "MessagesRead"    (conversationId, readAtUtc)   the other person read my messages
//   "Typing"          (conversationId)              the other person is typing
//   "PresenceChanged" (profileId, isOnline)         someone I chat with came online / went offline
[Authorize]
public class ChatHub(IChatService chatService, IPresenceTracker presence) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (userId is not null && presence.Connected(userId, Context.ConnectionId))
            await NotifyPartnersAsync(userId, isOnline: true);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (userId is not null && presence.Disconnected(userId, Context.ConnectionId))
            await NotifyPartnersAsync(userId, isOnline: false);

        await base.OnDisconnectedAsync(exception);
    }

    // Called by the browser while the user types (the browser limits how often)
    public async Task Typing(int conversationId)
    {
        var userId = Context.UserIdentifier;
        if (userId is null) return;

        var otherUserId = await chatService.GetOtherUserIdAsync(userId, conversationId);
        if (otherUserId is not null)
            await Clients.User(otherUserId).SendAsync("Typing", conversationId);
    }

    private async Task NotifyPartnersAsync(string userId, bool isOnline)
    {
        var info = await chatService.GetPresenceInfoAsync(userId);
        if (info is not null && info.PartnerUserIds.Count > 0)
            await Clients.Users(info.PartnerUserIds).SendAsync("PresenceChanged", info.MyProfileId, isOnline);
    }
}

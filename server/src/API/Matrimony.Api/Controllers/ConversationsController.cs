using Matrimony.Api.Extensions;
using Matrimony.Api.Hubs;
using Matrimony.Application.DTOs;
using Matrimony.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Matrimony.Api.Controllers;

// Chat over normal HTTP. After saving, it pushes the change live through the ChatHub.
[ApiController]
[Authorize]
[Route("api/conversations")]
public class ConversationsController(ChatService chatService, IHubContext<ChatHub> hub) : ControllerBase
{
    // GET /api/conversations — my chat list
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var list = await chatService.ListAsync(userId);
        return list is null ? NotFound(new { errors = new[] { "Profile not found." } }) : Ok(list);
    }

    // GET /api/conversations/unread-count — for the badge in the navbar
    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(new UnreadCountResponse(await chatService.GetUnreadCountAsync(userId)));
    }

    // GET /api/conversations/5/messages?before=120
    [HttpGet("{id:int}/messages")]
    public async Task<IActionResult> Messages(int id, [FromQuery] long? before)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var messages = await chatService.GetMessagesAsync(userId, id, before);
        return messages is null ? NotFound(new { errors = new[] { "Conversation not found." } }) : Ok(messages);
    }

    // POST /api/conversations/5/messages   { "body": "Assalamu alaikum" }
    [HttpPost("{id:int}/messages")]
    public async Task<IActionResult> Send(int id, SendMessageRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var result = await chatService.SendAsync(userId, id, request.Body);
        if (!result.Succeeded) return BadRequest(new { errors = result.Errors });

        var sent = result.Value!;
        // Live push to both people (the sender may have the chat open in another tab too)
        await hub.Clients.Users(sent.SenderUserId, sent.RecipientUserId).SendAsync("ReceiveMessage", sent.Message);
        return Ok(sent.Message);
    }

    // POST /api/conversations/5/read — I have read this conversation
    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var receipt = await chatService.MarkReadAsync(userId, id);
        if (receipt is null) return NotFound(new { errors = new[] { "Conversation not found." } });

        if (receipt.Count > 0)
            await hub.Clients.User(receipt.OtherUserId).SendAsync("MessagesRead", receipt.ConversationId, receipt.ReadAtUtc);
        return NoContent();
    }
}

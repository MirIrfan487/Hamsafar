using Matrimony.Api.Extensions;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Matrimony.Api.Controllers;

// The Android app tells us its push notification token (after login) and removes it (on logout)
[ApiController]
[Authorize]
[Route("api/devices")]
public class DevicesController(IDeviceTokenService deviceTokens) : ControllerBase
{
    // POST /api/devices   { "token": "...", "platform": "Android" }
    [HttpPost]
    public async Task<IActionResult> Register(RegisterDeviceRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        await deviceTokens.RegisterAsync(userId, request);
        return NoContent();
    }

    // DELETE /api/devices   { "token": "..." }
    [HttpDelete]
    public async Task<IActionResult> Unregister(UnregisterDeviceRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        await deviceTokens.UnregisterAsync(userId, request.Token);
        return NoContent();
    }
}

using Matrimony.Api.Extensions;
using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Matrimony.Api.Controllers;

// Members: report and block other profiles
[ApiController]
[Authorize]
public class SafetyController(SafetyService safetyService) : ControllerBase
{
    // POST /api/profiles/12/report   { "reason": "FakeProfile", "details": "..." }
    [HttpPost("api/profiles/{id:int}/report")]
    public async Task<IActionResult> Report(int id, ReportRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return ToResult(await safetyService.ReportAsync(userId, id, request));
    }

    // POST /api/profiles/12/block
    [HttpPost("api/profiles/{id:int}/block")]
    public async Task<IActionResult> Block(int id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return ToResult(await safetyService.BlockAsync(userId, id));
    }

    // DELETE /api/profiles/12/block
    [HttpDelete("api/profiles/{id:int}/block")]
    public async Task<IActionResult> Unblock(int id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return ToResult(await safetyService.UnblockAsync(userId, id));
    }

    // GET /api/blocks — people I blocked
    [HttpGet("api/blocks")]
    public async Task<IActionResult> Blocked()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await safetyService.ListBlockedAsync(userId));
    }

    private IActionResult ToResult(ServiceResult<bool> result) =>
        result.Succeeded ? NoContent()
        : result.ErrorCode == ErrorCodes.NotFound ? NotFound(new { errors = result.Errors })
        : BadRequest(new { errors = result.Errors });
}

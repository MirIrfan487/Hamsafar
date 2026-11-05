using Matrimony.Api.Extensions;
using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Matrimony.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/interests")]
public class InterestsController(IInterestService interestService) : ControllerBase
{
    // GET /api/interests?box=Received   (Received | Sent | Connected)
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] InterestBox box = InterestBox.Received)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var list = await interestService.ListAsync(userId, box);
        return list is null ? NotFound(new { errors = new[] { "Profile not found." } }) : Ok(list);
    }

    // GET /api/interests/summary — counts for the dashboard
    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var summary = await interestService.GetSummaryAsync(userId);
        return summary is null ? NotFound(new { errors = new[] { "Profile not found." } }) : Ok(summary);
    }

    // POST /api/interests   { "receiverProfileId": 12, "note": "..." }
    [HttpPost]
    public async Task<IActionResult> Send(SendInterestRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return ToResult(await interestService.SendAsync(userId, request));
    }

    // POST /api/interests/5/accept
    [HttpPost("{id:int}/accept")]
    public async Task<IActionResult> Accept(int id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return ToResult(await interestService.RespondAsync(userId, id, accept: true));
    }

    // POST /api/interests/5/reject
    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return ToResult(await interestService.RespondAsync(userId, id, accept: false));
    }

    // POST /api/interests/5/withdraw
    [HttpPost("{id:int}/withdraw")]
    public async Task<IActionResult> Withdraw(int id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return ToResult(await interestService.WithdrawAsync(userId, id));
    }

    private IActionResult ToResult(ServiceResult<InterestResponse> result) =>
        result.Succeeded ? Ok(result.Value) : BadRequest(new { errors = result.Errors });
}

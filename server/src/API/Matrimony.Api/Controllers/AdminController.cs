using Matrimony.Api.Extensions;
using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Services;
using Matrimony.Domain.Constants;
using Matrimony.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Matrimony.Api.Controllers;

// Only users with the "Admin" role can call anything here (members get 403).
[ApiController]
[Authorize(Roles = Roles.Admin)]
[Route("api/admin")]
public class AdminController(AdminService adminService) : ControllerBase
{
    // GET /api/admin/stats
    [HttpGet("stats")]
    public async Task<IActionResult> Stats() => Ok(await adminService.GetStatsAsync());

    // ---------- Profiles ----------

    // GET /api/admin/profiles/pending?page=1
    [HttpGet("profiles/pending")]
    public async Task<IActionResult> PendingProfiles([FromQuery] int page = 1) =>
        Ok(await adminService.GetPendingProfilesAsync(Math.Max(1, page)));

    // POST /api/admin/profiles/5/approve
    [HttpPost("profiles/{id:int}/approve")]
    public async Task<IActionResult> ApproveProfile(int id) =>
        ToResult(await adminService.ReviewProfileAsync(Actor(), id, approve: true, reason: null));

    // POST /api/admin/profiles/5/reject   { "reason": "Please add your city" }
    [HttpPost("profiles/{id:int}/reject")]
    public async Task<IActionResult> RejectProfile(int id, RejectRequest request) =>
        ToResult(await adminService.ReviewProfileAsync(Actor(), id, approve: false, request.Reason));

    // ---------- Photos ----------

    [HttpGet("photos/pending")]
    public async Task<IActionResult> PendingPhotos([FromQuery] int page = 1) =>
        Ok(await adminService.GetPendingPhotosAsync(Math.Max(1, page)));

    [HttpPost("photos/{id:int}/approve")]
    public async Task<IActionResult> ApprovePhoto(int id) =>
        ToResult(await adminService.ReviewPhotoAsync(Actor(), id, approve: true, reason: null));

    [HttpPost("photos/{id:int}/reject")]
    public async Task<IActionResult> RejectPhoto(int id, RejectRequest request) =>
        ToResult(await adminService.ReviewPhotoAsync(Actor(), id, approve: false, request.Reason));

    // ---------- Reports ----------

    // GET /api/admin/reports?status=Open&page=1
    [HttpGet("reports")]
    public async Task<IActionResult> Reports([FromQuery] ReportStatus status = ReportStatus.Open, [FromQuery] int page = 1) =>
        Ok(await adminService.GetReportsAsync(status, Math.Max(1, page)));

    // POST /api/admin/reports/5/resolve   { "outcome": "ActionTaken", "note": "...", "suspendReportedMember": true }
    [HttpPost("reports/{id:int}/resolve")]
    public async Task<IActionResult> ResolveReport(int id, ResolveReportRequest request) =>
        ToResult(await adminService.ResolveReportAsync(Actor(), id, request));

    // ---------- Members ----------

    // GET /api/admin/members?q=ayesha&page=1
    [HttpGet("members")]
    public async Task<IActionResult> Members([FromQuery] string? q, [FromQuery] int page = 1) =>
        Ok(await adminService.SearchMembersAsync(q, Math.Max(1, page)));

    [HttpPost("members/{userId}/suspend")]
    public async Task<IActionResult> Suspend(string userId, SuspendRequest request) =>
        ToResult(await adminService.SetSuspendedAsync(Actor(), userId, true, request.Note));

    [HttpPost("members/{userId}/unsuspend")]
    public async Task<IActionResult> Unsuspend(string userId, SuspendRequest request) =>
        ToResult(await adminService.SetSuspendedAsync(Actor(), userId, false, request.Note));

    // ---------- Activity log ----------

    [HttpGet("audit")]
    public async Task<IActionResult> Audit([FromQuery] int page = 1) =>
        Ok(await adminService.GetAuditLogAsync(Math.Max(1, page)));

    // ---------- Helpers ----------

    private AdminService.AdminActor Actor() =>
        new(User.GetUserId() ?? string.Empty, User.FindFirst("email")?.Value ?? string.Empty);

    private IActionResult ToResult(ServiceResult<bool> result) =>
        result.Succeeded ? NoContent()
        : result.ErrorCode == ErrorCodes.NotFound ? NotFound(new { errors = result.Errors })
        : BadRequest(new { errors = result.Errors });
}

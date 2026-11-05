using Matrimony.Api.Extensions;
using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Matrimony.Api.Controllers;

// The logged-in user's OWN profile. [Authorize] = a valid JWT is required for every action.
[ApiController]
[Authorize]
[Route("api/profile")]
public class ProfileController(IProfileService profileService) : ControllerBase
{
    // GET /api/profile/me
    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var profile = await profileService.GetMyProfileAsync(userId);
        return profile is null ? NotFound(new { errors = new[] { "Profile not found." } }) : Ok(profile);
    }

    // PUT /api/profile/me   (wizard saves here after each step)
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMine(UpdateProfileRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        return ToActionResult(await profileService.UpdateMyProfileAsync(userId, request));
    }

    // PUT /api/profile/me/preferences
    [HttpPut("me/preferences")]
    public async Task<IActionResult> UpdatePreferences(PartnerPreferenceRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        return ToActionResult(await profileService.UpdatePreferencesAsync(userId, request));
    }

    // POST /api/profile/me/submit   (sends the profile to the admin for approval)
    [HttpPost("me/submit")]
    public async Task<IActionResult> Submit()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        return ToActionResult(await profileService.SubmitForApprovalAsync(userId));
    }

    private IActionResult ToActionResult(ServiceResult<MyProfileResponse> result) =>
        result.Succeeded ? Ok(result.Value) : BadRequest(new { errors = result.Errors });
}

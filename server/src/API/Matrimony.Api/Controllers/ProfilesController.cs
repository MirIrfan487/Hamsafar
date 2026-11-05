using Matrimony.Api.Extensions;
using Matrimony.Application.DTOs;
using Matrimony.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Matrimony.Api.Controllers;

// OTHER members' profiles (your own profile is in ProfileController: /api/profile/me)
[ApiController]
[Authorize]
[Route("api/profiles")]
public class ProfilesController(SearchService searchService) : ControllerBase
{
    // GET /api/profiles/search?ageMin=24&ageMax=30&maritalStatuses=NeverMarried&city=Srinagar
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] SearchRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var result = await searchService.SearchAsync(userId, request);
        return result.Succeeded ? Ok(result.Value) : BadRequest(new { errors = result.Errors });
    }

    // GET /api/profiles/12
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var profile = await searchService.GetProfileAsync(userId, id);
        return profile is null ? NotFound(new { errors = new[] { "This profile is not available." } }) : Ok(profile);
    }
}

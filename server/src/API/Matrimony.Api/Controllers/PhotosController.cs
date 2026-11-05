using Matrimony.Api.Extensions;
using Matrimony.Application.Interfaces.Services;
using Matrimony.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Matrimony.Api.Controllers;

// Profile photos. Every action needs login.
[ApiController]
[Authorize]
public class PhotosController(IPhotoService photoService) : ControllerBase
{
    private const long MaxRequestBytes = 6 * 1024 * 1024;   // 5 MB photo + form overhead

    // GET /api/profile/me/photos — my photos (with approval status)
    [HttpGet("api/profile/me/photos")]
    public async Task<IActionResult> GetMine()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var photos = await photoService.GetMyPhotosAsync(userId);
        return photos is null ? NotFound(new { errors = new[] { "Profile not found." } }) : Ok(photos);
    }

    // POST /api/profile/me/photos — upload one photo (form field name: "file")
    [HttpPost("api/profile/me/photos")]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        await using var stream = file.OpenReadStream();
        var result = await photoService.UploadAsync(userId, stream, file.Length, file.ContentType);
        return result.Succeeded ? Ok(result.Value) : BadRequest(new { errors = result.Errors });
    }

    // DELETE /api/profile/me/photos/5
    [HttpDelete("api/profile/me/photos/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var result = await photoService.DeleteAsync(userId, id);
        return result.Succeeded ? NoContent() : NotFound(new { errors = result.Errors });
    }

    // PUT /api/profile/me/photos/5/main — make this the main photo
    [HttpPut("api/profile/me/photos/{id:int}/main")]
    public async Task<IActionResult> SetMain(int id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var result = await photoService.SetMainAsync(userId, id);
        return result.Succeeded ? NoContent() : NotFound(new { errors = result.Errors });
    }

    // GET /api/photos/5 — the image itself, only if this user may see it (privacy rules in PhotoService)
    [HttpGet("api/photos/{id:int}")]
    public async Task<IActionResult> GetPhoto(int id)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var stream = await photoService.OpenPhotoForViewerAsync(userId, User.IsInRole(Roles.Admin), id);
        if (stream is null) return NotFound();

        Response.Headers.CacheControl = "private, max-age=300";   // browser may keep it 5 min, never shared caches
        return File(stream, "image/jpeg");
    }
}

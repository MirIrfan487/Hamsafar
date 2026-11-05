using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Matrimony.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    // POST /api/auth/signup
    [HttpPost("Signup")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await authService.RegisterAsync(request);

        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors });

        return Ok(new { message = "Account created. You can now log in.", userId = result.UserId });
    }

    // POST /api/auth/login  -> returns a JWT
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await authService.LoginAsync(request);

        if (!result.Succeeded)
            return Unauthorized(new { errors = new[] { result.Error } });

        return Ok(result.Response);
    }

    // GET /api/auth/me  -> only works with a valid token ("Authorization: Bearer <token>")
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        // "sub" is the user id we put inside the token
        var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (userId is null)
            return Unauthorized();

        var user = await authService.GetCurrentUserAsync(userId);
        if (user is null)
            return Unauthorized();

        return Ok(user);
    }
}

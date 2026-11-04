using Matrimony.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Api.Controllers;

// Small endpoints to check that the API and database are running.
[ApiController]
[Route("api/[controller]")]
public class HealthController(AppDbContext db) : ControllerBase
{
    // GET /api/health
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "ok",
            app = "Matrimony.Api",
            serverTimeUtc = DateTime.UtcNow
        });
    }

    // GET /api/health/db
    [HttpGet("db")]
    public async Task<IActionResult> CheckDatabase()
    {
        var canConnect = await db.Database.CanConnectAsync();
        var profileCount = canConnect ? await db.Profiles.CountAsync() : 0;
        var planCount = canConnect ? await db.SubscriptionPlans.CountAsync() : 0;

        return Ok(new { databaseConnected = canConnect, profileCount, planCount });
    }
}

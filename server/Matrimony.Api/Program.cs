// Program.cs is the entry point of the API.
// 1) Register services (dependency injection)  2) Build the app  3) Set up the request pipeline

using Matrimony.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ---------- Services ----------
builder.Services.AddControllers();   // enables [ApiController] classes in /Controllers
builder.Services.AddOpenApi();       // generates the API description at /openapi/v1.json

// Database: AppDbContext talks to SQL Server using "DefaultConnection" from appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Later phases will add here: Identity + JWT (Phase 2), SignalR (Phase 6)

var app = builder.Build();

// ---------- Request pipeline (order matters) ----------
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    // In production force HTTPS. In development we skip it so the React
    // dev server can reach the API on http://localhost:5080.
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

app.Run();

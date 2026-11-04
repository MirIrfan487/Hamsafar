// Program.cs is the entry point of the API.
// 1) Register services (dependency injection)  2) Build the app  3) Set up the request pipeline

using System.Text;
using System.Text.Json.Serialization;
using Matrimony.Api.Data;
using Matrimony.Api.Models;
using Matrimony.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---------- Services ----------
builder.Services.AddControllers()
    .AddJsonOptions(o =>
        // Send/receive enums as text ("Female") instead of numbers (1)
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddOpenApi();       // generates the API description at /openapi/v1.json

// Database: AppDbContext talks to SQL Server using "DefaultConnection" from appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity: user accounts, password hashing, roles
builder.Services.AddIdentityCore<AppUser>(options =>
    {
        options.User.RequireUniqueEmail = true;

        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;

        // Lock the account for 15 minutes after 5 wrong passwords (used at login)
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();

// JWT settings from the "Jwt" section. ValidateOnStart stops the app at startup
// if the key is missing or too short (but still lets Add-Migration work).
builder.Services.AddOptions<JwtSettings>()
    .Bind(builder.Configuration.GetSection("Jwt"))
    .Validate(s => s.Key.Length >= 32,
        "Jwt:Key is missing or shorter than 32 characters. Set it in appsettings.Development.json " +
        "for local work, or in the Jwt__Key environment variable in production.")
    .ValidateOnStart();

// JWT authentication: checks the token on every request that has one
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtSettings>>((options, jwtOptions) =>
    {
        var jwt = jwtOptions.Value;
        options.MapInboundClaims = false;   // keep claim names as we wrote them ("sub", "role")
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = JwtRegisteredClaimNames.Sub,
            RoleClaimType = TokenService.RoleClaim   // makes [Authorize(Roles = "Admin")] work
        };
    });
builder.Services.AddAuthorization();

// Our own services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<TokenService>();

// Later phases will add here: SignalR (Phase 6)

var app = builder.Build();

// Create the Member/Admin roles if they don't exist yet
await SeedData.SeedRolesAsync(app.Services);

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

app.UseAuthentication();   // 1) who are you? (reads the token)
app.UseAuthorization();    // 2) are you allowed? (checks [Authorize])

app.MapControllers();

app.Run();

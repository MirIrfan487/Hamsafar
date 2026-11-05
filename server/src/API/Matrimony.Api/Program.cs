// Program.cs is the entry point of the API (the "composition root").
// It plugs the layers together:  API -> Application -> Domain
//                                  ↳ Persistence / Infrastructure (implement Application interfaces)

using System.Text;
using System.Text.Json.Serialization;
using Matrimony.Api.Hubs;
using Matrimony.Application;
using Matrimony.Application.Common;
using Matrimony.Application.Interfaces;
using Matrimony.Infrastructure;
using Matrimony.Infrastructure.Authentication;
using Matrimony.Persistence;
using Matrimony.Persistence.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ---------- Layers ----------
builder.Services.AddApplication();                          // services (AuthService, ProfileService)
builder.Services.AddPersistence(builder.Configuration);     // SQL Server, AppDbContext, Identity
builder.Services.AddInfrastructure(builder.Configuration);  // JWT TokenService

// ---------- Web API ----------
builder.Services.AddControllers()
    .AddJsonOptions(o =>
        // Send/receive enums as text ("Female") instead of numbers (1)
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// Same enum-as-text setting for the OpenAPI document, so Swagger shows "Female" instead of 1
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// OpenAPI document at /openapi/v1.json (Swagger UI reads it).
// The transformer adds the "Authorize" button for JWT tokens.
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Paste the token from POST /api/auth/login (without the word Bearer)."
        };
        document.SecurityRequirements.Add(new OpenApiSecurityRequirement
        {
            [new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            }] = Array.Empty<string>()
        });
        return Task.CompletedTask;
    });
});

// ---------- JWT authentication: checks the token on every request that has one ----------
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
            RoleClaimType = AppClaimTypes.Role   // makes [Authorize(Roles = "Admin")] work
        };

        // Browsers cannot send an Authorization header when opening a WebSocket,
        // so SignalR sends the token as ?access_token=... — accept it only for /hubs
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) && context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    context.Token = token;
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

// ---------- Real-time chat (SignalR) ----------
builder.Services.AddSignalR()
    .AddJsonProtocol(o => o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddSingleton<IUserIdProvider, SubClaimUserIdProvider>();   // Clients.User(id) = our user id
builder.Services.AddSingleton<PresenceTracker>();                           // who is online
builder.Services.AddSingleton<IPresenceTracker>(sp => sp.GetRequiredService<PresenceTracker>());

var app = builder.Build();

// Create the Member/Admin roles if they don't exist yet
await SeedData.SeedRolesAsync(app.Services);

// Development only: 10 approved sample profiles for testing search (see appsettings.Development.json)
if (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("SeedSampleProfiles"))
{
    await SampleProfiles.SeedAsync(app.Services);
}

// ---------- Request pipeline (order matters) ----------
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // Swagger UI at http://localhost:5080/swagger (development only)
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "Matrimony API v1");
        options.RoutePrefix = "swagger";
    });
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
app.MapHub<ChatHub>("/hubs/chat");

app.Run();

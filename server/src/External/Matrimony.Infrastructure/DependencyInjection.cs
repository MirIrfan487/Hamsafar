using Matrimony.Application.Interfaces;
using Matrimony.Infrastructure.Authentication;
using Matrimony.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Matrimony.Infrastructure;

// Registers the Infrastructure layer. Called from Program.cs: builder.Services.AddInfrastructure(builder.Configuration);
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // JWT settings from the "Jwt" section. ValidateOnStart stops the app at startup
        // if the key is missing or too short (but still lets Add-Migration work).
        services.AddOptions<JwtSettings>()
            .Bind(configuration.GetSection("Jwt"))
            .Validate(s => s.Key.Length >= 32,
                "Jwt:Key is missing or shorter than 32 characters. Set it in appsettings.Development.json " +
                "for local work, or in the Jwt__Key environment variable in production.")
            .ValidateOnStart();

        services.AddScoped<ITokenService, TokenService>();

        // Photo files on the server's disk
        services.Configure<PhotoStorageSettings>(configuration.GetSection("PhotoStorage"));
        services.AddSingleton<IPhotoStorage, LocalPhotoStorage>();

        return services;
    }
}

using Matrimony.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Matrimony.Application;

// Registers the Application layer. Called from Program.cs: builder.Services.AddApplication();
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<ProfileService>();
        services.AddScoped<PhotoService>();
        services.AddScoped<SearchService>();
        services.AddScoped<InterestService>();
        services.AddScoped<ChatService>();
        return services;
    }
}

using System.Reflection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Matrimony.Api.Extensions;

public static class ServiceCollectionExtensions
{
    // Registers every class named "...Service" that implements a matching "I...Service" interface,
    // e.g. AuthService : IAuthService  ->  services.AddScoped<IAuthService, AuthService>().
    // A new service is picked up automatically: create XyzService + IXyzService and you are done.
    // TryAdd = anything registered explicitly before (with a special lifetime) is not overwritten.
    public static IServiceCollection AddServicesFromAssemblies(this IServiceCollection services, params Assembly[] assemblies)
    {
        var implementations = assemblies
            .SelectMany(a => a.GetTypes())
            .Where(t => t is { IsClass: true, IsAbstract: false, IsGenericTypeDefinition: false } && t.Name.EndsWith("Service"));

        foreach (var implementation in implementations)
        {
            var contract = implementation.GetInterfaces().FirstOrDefault(i => i.Name == "I" + implementation.Name);
            if (contract is not null)
                services.TryAddScoped(contract, implementation);
        }

        return services;
    }
}

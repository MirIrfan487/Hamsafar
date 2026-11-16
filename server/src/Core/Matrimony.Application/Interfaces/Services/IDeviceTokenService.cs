using Matrimony.Application.DTOs;

namespace Matrimony.Application.Interfaces.Services;

// Phones that receive push notifications. Implemented by DeviceTokenService (Application/Services).
public interface IDeviceTokenService
{
    Task RegisterAsync(string userId, RegisterDeviceRequest request);
    Task UnregisterAsync(string userId, string token);
}

using System.ComponentModel.DataAnnotations;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.DTOs;

// POST /api/devices   { "token": "<from Firebase>", "platform": "Android" }
public class RegisterDeviceRequest
{
    [Required, MaxLength(512)] public string Token { get; set; } = string.Empty;
    [Required] public DevicePlatform? Platform { get; set; }
}

// DELETE /api/devices   { "token": "..." }  (on logout: stop notifications on this phone)
public class UnregisterDeviceRequest
{
    [Required, MaxLength(512)] public string Token { get; set; } = string.Empty;
}

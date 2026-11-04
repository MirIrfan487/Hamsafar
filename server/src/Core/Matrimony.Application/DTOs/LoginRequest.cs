using System.ComponentModel.DataAnnotations;

namespace Matrimony.Application.DTOs;

// What the Login form sends to POST /api/auth/login
public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

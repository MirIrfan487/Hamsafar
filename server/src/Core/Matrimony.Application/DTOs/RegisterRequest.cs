using System.ComponentModel.DataAnnotations;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.DTOs;

// What the Register form sends to POST /api/auth/register.
// The [Required]/[MaxLength] attributes are checked automatically by [ApiController];
// if any fail, the API returns 400 before our code even runs.
public class RegisterRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    // Nullable + [Required] so a missing value is an error instead of silently becoming the default
    [Required, EnumDataType(typeof(ProfileFor))]
    public ProfileFor? ProfileFor { get; set; }

    [Required, EnumDataType(typeof(Gender))]
    public Gender? Gender { get; set; }

    [Required]
    public DateOnly? DateOfBirth { get; set; }   // JSON format: "1998-05-20"
}

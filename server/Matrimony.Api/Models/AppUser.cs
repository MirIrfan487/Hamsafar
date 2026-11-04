using Microsoft.AspNetCore.Identity;

namespace Matrimony.Api.Models;

// The login account. IdentityUser already gives us Id, Email, PasswordHash,
// PhoneNumber, etc. (table: AspNetUsers). We add only what we need.
public class AppUser : IdentityUser
{
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastActiveAtUtc { get; set; }
    public bool IsSuspended { get; set; }

    // One account has at most one matrimonial profile
    public Profile? Profile { get; set; }
}

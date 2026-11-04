namespace Matrimony.Api.Models;

// Role names in one place, so we never mistype "Admin" somewhere.
public static class Roles
{
    public const string Member = "Member";
    public const string Admin = "Admin";

    public static readonly string[] All = [Member, Admin];
}

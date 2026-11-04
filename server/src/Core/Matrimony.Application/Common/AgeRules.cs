namespace Matrimony.Application.Common;

public static class AgeRules
{
    public const int MinimumAge = 18;

    public static int CalculateAge(DateOnly dateOfBirth)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth > today.AddYears(-age)) age--;   // birthday not reached yet this year
        return age;
    }

    // Returns an error message, or null if the date is fine
    public static string? Validate(DateOnly dateOfBirth)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (dateOfBirth > today.AddYears(-MinimumAge))
            return $"The person must be at least {MinimumAge} years old.";
        if (dateOfBirth < today.AddYears(-100))
            return "Please enter a valid date of birth.";
        return null;
    }
}

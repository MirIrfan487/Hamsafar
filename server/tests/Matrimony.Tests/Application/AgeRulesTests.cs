using Matrimony.Application.Common;

namespace Matrimony.Tests.Application;

// Rule from CLAUDE.md: members must be 18+.
public class AgeRulesTests
{
    private static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);

    [Fact]
    public void Exactly_18_today_is_allowed() =>
        Assert.Null(AgeRules.Validate(Today.AddYears(-18)));

    [Fact]
    public void Turning_18_tomorrow_is_not_allowed() =>
        Assert.NotNull(AgeRules.Validate(Today.AddYears(-18).AddDays(1)));

    [Fact]
    public void Seventeen_is_not_allowed() =>
        Assert.NotNull(AgeRules.Validate(Today.AddYears(-17)));

    [Fact]
    public void More_than_100_years_ago_is_rejected_as_a_typo() =>
        Assert.NotNull(AgeRules.Validate(Today.AddYears(-101)));

    [Fact]
    public void Age_is_one_less_before_the_birthday_this_year() =>
        Assert.Equal(29, AgeRules.CalculateAge(Today.AddYears(-30).AddDays(1)));

    [Fact]
    public void Age_counts_the_birthday_itself() =>
        Assert.Equal(30, AgeRules.CalculateAge(Today.AddYears(-30)));
}

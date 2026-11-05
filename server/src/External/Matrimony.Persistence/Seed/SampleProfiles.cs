using Matrimony.Domain.Constants;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Matrimony.Persistence.Seed;

// DEVELOPMENT ONLY: creates approved sample profiles so search can be tested.
// Runs only when "SeedSampleProfiles": true (set in appsettings.Development.json).
// All sample accounts use the password "password123" and emails ending in @sample.test.
public static class SampleProfiles
{
    private const string Password = "password123";

    private record Sample(string Key, string FirstName, string LastName, Gender Gender, int Age, MaritalStatus Marital,
        int Height, string City, string State, string Education, string Occupation, Sect Sect, Religiosity Religiosity,
        ProfileFor For, string About);

    private static readonly Sample[] Samples =
    [
        new("f1", "Mariam", "Shah", Gender.Female, 25, MaritalStatus.NeverMarried, 160, "Baramulla", "Jammu and Kashmir", "MBBS", "Doctor", Sect.Sunni, Religiosity.Practicing, ProfileFor.Daughter,
            "Works at a government hospital. Calm, caring and close to her family."),
        new("f2", "Hafsa", "Rather", Gender.Female, 29, MaritalStatus.NeverMarried, 157, "Anantnag", "Jammu and Kashmir", "B.Tech", "Software engineer", Sect.Sunni, Religiosity.VeryPracticing, ProfileFor.Self,
            "Engineer who enjoys reading and cooking. Looking for a practicing, kind spouse."),
        new("f3", "Insha", "Mir", Gender.Female, 27, MaritalStatus.Divorced, 163, "Srinagar", "Jammu and Kashmir", "M.Ed", "Teacher", Sect.JustMuslim, Religiosity.Practicing, ProfileFor.Sister,
            "Teacher at a private school. Values honesty and a simple family life."),
        new("f4", "Sana", "Qureshi", Gender.Female, 24, MaritalStatus.NeverMarried, 155, "Delhi", "Delhi", "B.Com", "Accountant", Sect.Sunni, Religiosity.ModeratelyPracticing, ProfileFor.Daughter,
            "Works in accounts at a family business. Friendly and organised."),
        new("f5", "Zainab", "Naqvi", Gender.Female, 31, MaritalStatus.Widowed, 165, "Jammu", "Jammu and Kashmir", "MA Urdu", "Lecturer", Sect.Shia, Religiosity.Practicing, ProfileFor.Self,
            "Lecturer and writer. Looking for an understanding and mature partner."),
        new("m1", "Bilal", "Wani", Gender.Male, 28, MaritalStatus.NeverMarried, 178, "Srinagar", "Jammu and Kashmir", "MBA", "Bank officer", Sect.Sunni, Religiosity.Practicing, ProfileFor.Son,
            "Works at a bank in Srinagar. Enjoys cricket and family time."),
        new("m2", "Umar", "Lone", Gender.Male, 31, MaritalStatus.NeverMarried, 175, "Sopore", "Jammu and Kashmir", "B.Tech", "Civil engineer", Sect.Sunni, Religiosity.VeryPracticing, ProfileFor.Self,
            "Civil engineer working on road projects. Prays regularly and values family."),
        new("m3", "Faisal", "Bhat", Gender.Male, 33, MaritalStatus.Divorced, 180, "Delhi", "Delhi", "MCA", "Software developer", Sect.JustMuslim, Religiosity.ModeratelyPracticing, ProfileFor.Brother,
            "Developer at an IT company in Delhi. Calm and responsible."),
        new("m4", "Adil", "Dar", Gender.Male, 27, MaritalStatus.NeverMarried, 173, "Anantnag", "Jammu and Kashmir", "BUMS", "Doctor", Sect.Sunni, Religiosity.Practicing, ProfileFor.Son,
            "Doctor practising Unani medicine. Kind and family-oriented."),
        new("m5", "Haider", "Abbas", Gender.Male, 30, MaritalStatus.NeverMarried, 183, "Jammu", "Jammu and Kashmir", "LLB", "Lawyer", Sect.Shia, Religiosity.Practicing, ProfileFor.Self,
            "Lawyer at the High Court. Enjoys history and travel."),
    ];

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var s in Samples)
        {
            var email = $"sample.{s.Key}@sample.test";
            if (await userManager.FindByEmailAsync(email) is not null) continue;   // already created

            var user = new AppUser { UserName = email, Email = email };
            var created = await userManager.CreateAsync(user, Password);
            if (!created.Succeeded) continue;
            await userManager.AddToRoleAsync(user, Roles.Member);

            db.Profiles.Add(new Profile
            {
                UserId = user.Id,
                ProfileFor = s.For,
                FirstName = s.FirstName,
                LastName = s.LastName,
                Gender = s.Gender,
                DateOfBirth = today.AddYears(-s.Age).AddDays(-40),
                MaritalStatus = s.Marital,
                HeightCm = s.Height,
                Country = "India",
                State = s.State,
                City = s.City,
                Education = s.Education,
                Occupation = s.Occupation,
                Sect = s.Sect,
                Religiosity = s.Religiosity,
                MotherTongue = s.State == "Delhi" ? "Urdu" : "Kashmiri",
                AboutMe = s.About,
                PhotoPrivacy = PhotoPrivacy.AcceptedInterestsOnly,
                Status = ProfileStatus.Approved,
                PartnerPreference = new PartnerPreference { AgeMin = Math.Max(18, s.Age - 5), AgeMax = s.Age + 5 }
            });
        }

        await db.SaveChangesAsync();
    }
}

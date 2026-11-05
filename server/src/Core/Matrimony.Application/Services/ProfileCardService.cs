using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces;
using Matrimony.Application.Interfaces.Services;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Application.Services;

// Shared by search, interests and chat, so the same privacy rules are used everywhere
// a profile card is shown. Injected as IProfileCardService (registered automatically).
public class ProfileCardService(IAppDbContext db) : IProfileCardService
{
    public IQueryable<ProfileCardRow> ToRows(IQueryable<Profile> profiles) =>
        profiles.Select(p => new ProfileCardRow
        {
            Id = p.Id,
            FirstName = p.FirstName,
            LastName = p.LastName,
            ShowLastName = p.ShowLastName,
            DateOfBirth = p.DateOfBirth,
            HeightCm = p.HeightCm,
            City = p.City,
            State = p.State,
            Education = p.Education,
            Occupation = p.Occupation,
            MaritalStatus = p.MaritalStatus,
            Sect = p.Sect,
            Religiosity = p.Religiosity,
            ProfileFor = p.ProfileFor,
            PhotoPrivacy = p.PhotoPrivacy,
            Status = p.Status,
            PhotoId = p.Photos
                .Where(ph => ph.Status == PhotoStatus.Approved)
                .OrderByDescending(ph => ph.IsMain).ThenBy(ph => ph.UploadedAtUtc)
                .Select(ph => (int?)ph.Id)
                .FirstOrDefault()
        });

    public ProfileCardResponse ToCard(ProfileCardRow x, ICollection<int> acceptedIds)
    {
        // Others only see photos of approved profiles, and only if privacy allows
        var canSee = x.PhotoId is not null && x.Status == ProfileStatus.Approved
                     && CanSeePhotos(x.PhotoPrivacy, acceptedIds.Contains(x.Id));
        var locked = x.PhotoId is not null && !canSee && x.PhotoPrivacy == PhotoPrivacy.AcceptedInterestsOnly;

        return new ProfileCardResponse(
            x.Id, DisplayName(x.FirstName, x.LastName, x.ShowLastName), AgeRules.CalculateAge(x.DateOfBirth), x.HeightCm,
            x.City, x.State, x.Education, x.Occupation, x.MaritalStatus, x.Sect, x.Religiosity, x.ProfileFor,
            canSee ? x.PhotoId : null, locked);
    }

    // Profiles that have an ACCEPTED interest with me, in either direction
    public Task<List<int>> AcceptedInterestProfileIdsAsync(int myProfileId) =>
        db.Interests
            .Where(i => i.Status == InterestStatus.Accepted &&
                        (i.SenderProfileId == myProfileId || i.ReceiverProfileId == myProfileId))
            .Select(i => i.SenderProfileId == myProfileId ? i.ReceiverProfileId : i.SenderProfileId)
            .ToListAsync();

    // Same rules as PhotoService.CanViewAsync (photo status is checked separately)
    public bool CanSeePhotos(PhotoPrivacy privacy, bool hasAcceptedInterest) => privacy switch
    {
        PhotoPrivacy.AllMembers => true,
        PhotoPrivacy.AcceptedInterestsOnly => hasAcceptedInterest,
        _ => false
    };

    // "Ayesha" or "Ayesha Khan" — the last name only if the member chose to show it
    public string DisplayName(string firstName, string? lastName, bool showLastName) =>
        showLastName && !string.IsNullOrWhiteSpace(lastName) ? $"{firstName} {lastName}" : firstName;

    // True if either profile has blocked the other
    public Task<bool> IsBlockedAsync(int profileA, int profileB) =>
        db.Blocks.AnyAsync(b =>
            (b.BlockerProfileId == profileA && b.BlockedProfileId == profileB) ||
            (b.BlockerProfileId == profileB && b.BlockedProfileId == profileA));
}

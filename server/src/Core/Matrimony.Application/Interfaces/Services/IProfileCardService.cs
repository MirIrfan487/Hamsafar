using Matrimony.Application.DTOs;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.Interfaces.Services;

// Builds profile cards and applies the privacy / block rules. Implemented by ProfileCardService.
public interface IProfileCardService
{
    IQueryable<ProfileCardRow> ToRows(IQueryable<Profile> profiles);
    ProfileCardResponse ToCard(ProfileCardRow x, ICollection<int> acceptedIds);
    Task<List<int>> AcceptedInterestProfileIdsAsync(int myProfileId);
    bool CanSeePhotos(PhotoPrivacy privacy, bool hasAcceptedInterest);
    string DisplayName(string firstName, string? lastName, bool showLastName);
    Task<bool> IsBlockedAsync(int profileA, int profileB);
}

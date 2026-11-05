using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.Interfaces.Services;

// Search profiles, view one profile, contact details. Implemented by SearchService (Application/Services).
public interface ISearchService
{
    Task<ServiceResult<PagedResult<ProfileCardResponse>>> SearchAsync(string viewerUserId, SearchRequest r);
    Task<ProfileDetailResponse?> GetProfileAsync(string viewerUserId, int profileId);
    Task<ServiceResult<ContactDetailsResponse>> GetContactDetailsAsync(string viewerUserId, int profileId);
}

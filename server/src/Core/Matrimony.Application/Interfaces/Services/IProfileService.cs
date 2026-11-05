using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.Interfaces.Services;

// The logged-in member's own profile and partner preferences. Implemented by ProfileService (Application/Services).
public interface IProfileService
{
    Task<MyProfileResponse?> GetMyProfileAsync(string userId);
    Task<ServiceResult<MyProfileResponse>> UpdateMyProfileAsync(string userId, UpdateProfileRequest r);
    Task<ServiceResult<MyProfileResponse>> UpdatePreferencesAsync(string userId, PartnerPreferenceRequest r);
    Task<ServiceResult<MyProfileResponse>> SubmitForApprovalAsync(string userId);
}

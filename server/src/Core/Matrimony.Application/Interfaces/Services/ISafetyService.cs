using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.Interfaces.Services;

// Members reporting and blocking other profiles. Implemented by SafetyService (Application/Services).
public interface ISafetyService
{
    Task<ServiceResult<bool>> ReportAsync(string userId, int profileId, ReportRequest r);
    Task<ServiceResult<bool>> BlockAsync(string userId, int profileId);
    Task<ServiceResult<bool>> UnblockAsync(string userId, int profileId);
    Task<IReadOnlyList<BlockedMemberResponse>> ListBlockedAsync(string userId);
}

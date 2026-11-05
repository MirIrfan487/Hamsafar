using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.Interfaces.Services;

// Admin panel: review profiles/photos, reports, members, activity log. Implemented by AdminService (Application/Services).
public interface IAdminService
{
    Task<AdminStatsResponse> GetStatsAsync();
    Task<PagedResult<AdminProfileReview>> GetPendingProfilesAsync(int page);
    Task<ServiceResult<bool>> ReviewProfileAsync(AdminActor admin, int profileId, bool approve, string? reason);
    Task<PagedResult<AdminPhotoItem>> GetPendingPhotosAsync(int page);
    Task<ServiceResult<bool>> ReviewPhotoAsync(AdminActor admin, int photoId, bool approve, string? reason);
    Task<PagedResult<AdminReportItem>> GetReportsAsync(ReportStatus status, int page);
    Task<ServiceResult<bool>> ResolveReportAsync(AdminActor admin, int reportId, ResolveReportRequest r);
    Task<PagedResult<AdminMemberItem>> SearchMembersAsync(string? query, int page);
    Task<ServiceResult<bool>> SetSuspendedAsync(AdminActor admin, string userId, bool suspended, string? note);
    Task<PagedResult<AuditLogItem>> GetAuditLogAsync(int page);
}

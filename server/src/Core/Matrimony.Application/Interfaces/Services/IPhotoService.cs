using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.Interfaces.Services;

// Upload, delete and show profile photos. Implemented by PhotoService (Application/Services).
public interface IPhotoService
{
    Task<IReadOnlyList<MyPhotoResponse>?> GetMyPhotosAsync(string userId);
    Task<ServiceResult<MyPhotoResponse>> UploadAsync(string userId, Stream content, long length, string? contentType);
    Task<ServiceResult<bool>> DeleteAsync(string userId, int photoId);
    Task<ServiceResult<bool>> SetMainAsync(string userId, int photoId);
    Task<Stream?> OpenPhotoForViewerAsync(string viewerUserId, bool viewerIsAdmin, int photoId);
}

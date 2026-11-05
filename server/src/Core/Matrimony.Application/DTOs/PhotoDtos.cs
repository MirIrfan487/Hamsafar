using Matrimony.Domain.Enums;

namespace Matrimony.Application.DTOs;

// The owner's view of one of their photos. The image itself is loaded from GET /api/photos/{id}.
public record MyPhotoResponse(int Id, bool IsMain, PhotoStatus Status, DateTime UploadedAtUtc);

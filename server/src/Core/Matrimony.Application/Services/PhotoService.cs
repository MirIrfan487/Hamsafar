using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces;
using Matrimony.Domain.Entities;
using Matrimony.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Application.Services;

// Uploading, managing and viewing profile photos — with all the privacy rules in one place.
public class PhotoService(IAppDbContext db, IPhotoStorage storage)
{
    public const int MaxPhotos = 6;
    public const long MaxFileBytes = 5 * 1024 * 1024;   // 5 MB
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];

    // ---------- Owner: list ----------

    public async Task<IReadOnlyList<MyPhotoResponse>?> GetMyPhotosAsync(string userId)
    {
        var profileId = await GetProfileIdAsync(userId);
        if (profileId is null) return null;

        return await db.ProfilePhotos
            .Where(p => p.ProfileId == profileId)
            .OrderByDescending(p => p.IsMain)
            .ThenBy(p => p.UploadedAtUtc)
            .Select(p => new MyPhotoResponse(p.Id, p.IsMain, p.Status, p.UploadedAtUtc))
            .ToListAsync();
    }

    // ---------- Owner: upload ----------

    public async Task<ServiceResult<MyPhotoResponse>> UploadAsync(string userId, Stream content, long length, string? contentType)
    {
        if (length == 0) return ServiceResult<MyPhotoResponse>.Fail("Please choose a photo.");
        if (length > MaxFileBytes) return ServiceResult<MyPhotoResponse>.Fail("Photo must be 5 MB or smaller.");
        if (contentType is null || !AllowedContentTypes.Contains(contentType.ToLowerInvariant()))
            return ServiceResult<MyPhotoResponse>.Fail("Only JPG, PNG or WEBP photos are allowed.");

        var profileId = await GetProfileIdAsync(userId);
        if (profileId is null) return ServiceResult<MyPhotoResponse>.Fail("Profile not found.");

        var count = await db.ProfilePhotos.CountAsync(p => p.ProfileId == profileId);
        if (count >= MaxPhotos)
            return ServiceResult<MyPhotoResponse>.Fail($"You can upload up to {MaxPhotos} photos. Delete one to add another.");

        string fileName;
        try
        {
            fileName = await storage.SaveAsync(content);
        }
        catch (InvalidPhotoException ex)
        {
            return ServiceResult<MyPhotoResponse>.Fail(ex.Message);
        }

        var photo = new ProfilePhoto
        {
            ProfileId = profileId.Value,
            FilePath = fileName,
            IsMain = count == 0,            // the first photo becomes the main photo
            Status = PhotoStatus.Pending    // admin must approve before others can see it
        };
        db.ProfilePhotos.Add(photo);
        await db.SaveChangesAsync();

        return ServiceResult<MyPhotoResponse>.Ok(new MyPhotoResponse(photo.Id, photo.IsMain, photo.Status, photo.UploadedAtUtc));
    }

    // ---------- Owner: delete ----------

    public async Task<ServiceResult<bool>> DeleteAsync(string userId, int photoId)
    {
        var photo = await FindMyPhotoAsync(userId, photoId);
        if (photo is null) return ServiceResult<bool>.Fail("Photo not found.");

        db.ProfilePhotos.Remove(photo);

        // If the main photo is deleted, the oldest remaining photo becomes main
        if (photo.IsMain)
        {
            var next = await db.ProfilePhotos
                .Where(p => p.ProfileId == photo.ProfileId && p.Id != photo.Id)
                .OrderBy(p => p.UploadedAtUtc)
                .FirstOrDefaultAsync();
            if (next is not null) next.IsMain = true;
        }

        await db.SaveChangesAsync();
        await storage.DeleteAsync(photo.FilePath);   // remove the file only after the database change worked
        return ServiceResult<bool>.Ok(true);
    }

    // ---------- Owner: choose main photo ----------

    public async Task<ServiceResult<bool>> SetMainAsync(string userId, int photoId)
    {
        var photo = await FindMyPhotoAsync(userId, photoId);
        if (photo is null) return ServiceResult<bool>.Fail("Photo not found.");

        var currentMain = await db.ProfilePhotos
            .Where(p => p.ProfileId == photo.ProfileId && p.IsMain && p.Id != photo.Id)
            .ToListAsync();
        foreach (var p in currentMain) p.IsMain = false;
        photo.IsMain = true;

        await db.SaveChangesAsync();
        return ServiceResult<bool>.Ok(true);
    }

    // ---------- Anyone logged in: view one photo ----------

    // Returns the image ONLY if this viewer is allowed to see it, otherwise null.
    // (The controller answers 404 in both cases, so nobody can tell a hidden photo exists.)
    public async Task<Stream?> OpenPhotoForViewerAsync(string viewerUserId, bool viewerIsAdmin, int photoId)
    {
        var photo = await db.ProfilePhotos
            .Include(p => p.Profile)
            .FirstOrDefaultAsync(p => p.Id == photoId);
        if (photo is null) return null;

        if (!await CanViewAsync(viewerUserId, viewerIsAdmin, photo)) return null;
        return await storage.OpenReadAsync(photo.FilePath);
    }

    private async Task<bool> CanViewAsync(string viewerUserId, bool viewerIsAdmin, ProfilePhoto photo)
    {
        var owner = photo.Profile;

        // The owner and admins can always see (admins need to approve photos)
        if (owner.UserId == viewerUserId || viewerIsAdmin) return true;

        // Everyone else: only approved photos of approved profiles
        if (photo.Status != PhotoStatus.Approved || owner.Status != ProfileStatus.Approved) return false;

        var viewerProfileId = await GetProfileIdAsync(viewerUserId);
        if (viewerProfileId is null) return false;

        // Blocked in either direction -> never
        var blocked = await db.Blocks.AnyAsync(b =>
            (b.BlockerProfileId == owner.Id && b.BlockedProfileId == viewerProfileId) ||
            (b.BlockerProfileId == viewerProfileId && b.BlockedProfileId == owner.Id));
        if (blocked) return false;

        return owner.PhotoPrivacy switch
        {
            PhotoPrivacy.AllMembers => true,
            // An accepted interest between the two of them, in either direction
            PhotoPrivacy.AcceptedInterestsOnly => await db.Interests.AnyAsync(i =>
                i.Status == InterestStatus.Accepted &&
                ((i.SenderProfileId == viewerProfileId && i.ReceiverProfileId == owner.Id) ||
                 (i.SenderProfileId == owner.Id && i.ReceiverProfileId == viewerProfileId))),
            _ => false   // Hidden
        };
    }

    // ---------- Helpers ----------

    private Task<int?> GetProfileIdAsync(string userId) =>
        db.Profiles.Where(p => p.UserId == userId).Select(p => (int?)p.Id).FirstOrDefaultAsync();

    private async Task<ProfilePhoto?> FindMyPhotoAsync(string userId, int photoId)
    {
        var profileId = await GetProfileIdAsync(userId);
        if (profileId is null) return null;
        return await db.ProfilePhotos.FirstOrDefaultAsync(p => p.Id == photoId && p.ProfileId == profileId);
    }
}

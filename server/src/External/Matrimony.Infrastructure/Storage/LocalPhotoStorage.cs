using Matrimony.Application.Common;
using Matrimony.Application.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace Matrimony.Infrastructure.Storage;

// Saves photos as files on the server's disk.
public class LocalPhotoStorage(IOptions<PhotoStorageSettings> options, IHostEnvironment environment) : IPhotoStorage
{
    private const int MinDimension = 200;
    private const long MaxPixels = 40_000_000;   // protects the server from "image bombs"

    private string RootFolder =>
        Path.IsPathRooted(options.Value.RootPath)
            ? options.Value.RootPath
            : Path.Combine(environment.ContentRootPath, options.Value.RootPath);

    public async Task<string> SaveAsync(Stream image, CancellationToken cancellationToken = default)
    {
        // Copy into memory (max 5 MB, checked earlier) so we can read it twice
        using var buffer = new MemoryStream();
        await image.CopyToAsync(buffer, cancellationToken);

        // 1) Is it really an image, and is it a sensible size?
        ImageInfo info;
        try
        {
            buffer.Position = 0;
            info = await Image.IdentifyAsync(buffer, cancellationToken);
        }
        catch (Exception ex) when (ex is ImageFormatException or NotSupportedException)
        {
            throw new InvalidPhotoException("This file is not a valid photo. Please upload a JPG, PNG or WEBP image.");
        }

        if (info.Width < MinDimension || info.Height < MinDimension)
            throw new InvalidPhotoException($"Photo is too small. Please use one at least {MinDimension} × {MinDimension} pixels.");
        if ((long)info.Width * info.Height > MaxPixels)
            throw new InvalidPhotoException("Photo is too large in pixels. Please use a smaller photo.");

        // 2) Load, turn upright, shrink if needed
        var max = options.Value.MaxDimension;
        buffer.Position = 0;
        using var img = await Image.LoadAsync(new DecoderOptions { TargetSize = new Size(max, max) }, buffer, cancellationToken);

        img.Mutate(x => x.AutoOrient());
        if (img.Width > max || img.Height > max)
            img.Mutate(x => x.Resize(new ResizeOptions { Mode = ResizeMode.Max, Size = new Size(max, max) }));
        img.Mutate(x => x.BackgroundColor(Color.White));   // transparent PNG -> white, not black

        // 3) Remove hidden data: EXIF can contain the GPS location where the photo was taken
        img.Metadata.ExifProfile = null;
        img.Metadata.IptcProfile = null;
        img.Metadata.XmpProfile = null;

        // 4) Save with a random name (never the user's file name)
        Directory.CreateDirectory(RootFolder);
        var fileName = $"{Guid.NewGuid():N}.jpg";
        await img.SaveAsJpegAsync(Path.Combine(RootFolder, fileName), new JpegEncoder { Quality = 85 }, cancellationToken);
        return fileName;
    }

    public Task<Stream?> OpenReadAsync(string fileName, CancellationToken cancellationToken = default)
    {
        var path = SafePath(fileName);
        Stream? stream = File.Exists(path)
            ? new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, useAsync: true)
            : null;
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string fileName, CancellationToken cancellationToken = default)
    {
        var path = SafePath(fileName);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    // Only plain file names inside our folder, never "../something"
    private string SafePath(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName) || Path.GetFileName(fileName) != fileName)
            throw new ArgumentException("Invalid photo file name.", nameof(fileName));
        return Path.Combine(RootFolder, fileName);
    }
}

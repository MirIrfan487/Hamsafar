using Matrimony.Application.Interfaces;

namespace Matrimony.Tests.Helpers;

// Stands in for LocalPhotoStorage: no files on disk. Every stored name "opens" as a few bytes,
// so a test can tell "the photo was handed out" (a stream) from "refused" (null).
public class FakePhotoStorage : IPhotoStorage
{
    public Task<string> SaveAsync(Stream image, CancellationToken cancellationToken = default) =>
        Task.FromResult($"{Guid.NewGuid():N}.jpg");

    public Task<Stream?> OpenReadAsync(string fileName, CancellationToken cancellationToken = default) =>
        Task.FromResult<Stream?>(new MemoryStream([0xFF, 0xD8, 0xFF]));   // the start of a JPEG

    public Task DeleteAsync(string fileName, CancellationToken cancellationToken = default) => Task.CompletedTask;
}

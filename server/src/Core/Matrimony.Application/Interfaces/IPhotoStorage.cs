namespace Matrimony.Application.Interfaces;

// Where profile photos are kept. Implemented in Infrastructure (LocalPhotoStorage).
// Later this can be swapped for cloud storage without changing any service.
public interface IPhotoStorage
{
    // Checks the image, removes hidden data (like GPS location), resizes it and saves it as JPEG.
    // Returns the stored file name. Throws InvalidPhotoException if the file is not a usable photo.
    Task<string> SaveAsync(Stream image, CancellationToken cancellationToken = default);

    // Returns null if the file does not exist
    Task<Stream?> OpenReadAsync(string fileName, CancellationToken cancellationToken = default);

    Task DeleteAsync(string fileName, CancellationToken cancellationToken = default);
}

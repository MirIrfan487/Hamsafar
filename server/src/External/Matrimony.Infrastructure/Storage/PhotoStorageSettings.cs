namespace Matrimony.Infrastructure.Storage;

// "PhotoStorage" section of appsettings.json
public class PhotoStorageSettings
{
    // Folder for photo files. A relative path is inside the API project folder.
    // It is NOT under wwwroot, so files can only be reached through the API (which checks privacy).
    public string RootPath { get; set; } = "App_Data/photos";

    // Longest side in pixels after resizing
    public int MaxDimension { get; set; } = 1600;
}

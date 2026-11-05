namespace Matrimony.Application.Common;

// Thrown by IPhotoStorage when an upload is not a usable photo. The message is safe to show to the user.
public class InvalidPhotoException(string message) : Exception(message);

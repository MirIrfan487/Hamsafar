namespace Matrimony.Infrastructure.Push;

// "Firebase" section. CredentialsPath = full path of the service-account JSON file downloaded from
// Firebase (Project settings -> Service accounts). Set it in User Secrets (development) or the
// Firebase__CredentialsPath environment variable (production). Keep the file OUT of the repository.
// Empty = push notifications are switched off (the rest of the app works normally).
public class FirebaseSettings
{
    public string CredentialsPath { get; set; } = string.Empty;
}

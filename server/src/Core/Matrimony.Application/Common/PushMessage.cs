namespace Matrimony.Application.Common;

// One push notification.
//  Title / Body: what the phone shows (also on the lock screen, so never put private details here).
//  Url:          the app page to open when the member taps it, e.g. "/interests?tab=Received".
//  Tag:          notifications with the same tag replace each other (one "new message" per chat, not twenty).
public record PushMessage(string Title, string Body, string Url, string? Tag = null);

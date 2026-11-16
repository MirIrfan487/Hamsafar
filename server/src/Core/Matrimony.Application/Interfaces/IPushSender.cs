using Matrimony.Application.Common;

namespace Matrimony.Application.Interfaces;

// Sends push notifications to phones. Implemented in Infrastructure (FirebasePushSender).
public interface IPushSender
{
    // Returns the tokens that no longer work (app uninstalled, token expired) so we can delete them.
    Task<IReadOnlyList<string>> SendAsync(IReadOnlyList<string> tokens, PushMessage message, CancellationToken ct = default);
}

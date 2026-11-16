using Matrimony.Application.Interfaces;

namespace Matrimony.Tests.Helpers;

// Stands in for the real PresenceTracker (who is connected to the chat hub).
// Tests decide who is "online" by adding user ids to Online.
public class FakePresenceTracker : IPresenceTracker
{
    public HashSet<string> Online { get; } = [];

    public bool Connected(string userId, string connectionId) => Online.Add(userId);
    public bool Disconnected(string userId, string connectionId) => Online.Remove(userId);
    public bool IsOnline(string userId) => Online.Contains(userId);
}

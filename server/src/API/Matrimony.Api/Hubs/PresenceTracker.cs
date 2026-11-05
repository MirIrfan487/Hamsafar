using Matrimony.Application.Interfaces;

namespace Matrimony.Api.Hubs;

// Remembers which users are connected to the chat hub (a user can have several tabs open).
// Kept in memory: fine for one server. With several servers this would move to Redis.
public class PresenceTracker : IPresenceTracker
{
    private readonly Dictionary<string, HashSet<string>> _connections = new();
    private readonly Lock _lock = new();

    // Returns true if this is the user's FIRST connection (they just came online)
    public bool Connected(string userId, string connectionId)
    {
        lock (_lock)
        {
            if (!_connections.TryGetValue(userId, out var set))
            {
                set = new HashSet<string>();
                _connections[userId] = set;
            }
            set.Add(connectionId);
            return set.Count == 1;
        }
    }

    // Returns true if this was the user's LAST connection (they just went offline)
    public bool Disconnected(string userId, string connectionId)
    {
        lock (_lock)
        {
            if (!_connections.TryGetValue(userId, out var set)) return false;
            set.Remove(connectionId);
            if (set.Count > 0) return false;
            _connections.Remove(userId);
            return true;
        }
    }

    public bool IsOnline(string userId)
    {
        lock (_lock)
        {
            return _connections.ContainsKey(userId);
        }
    }
}

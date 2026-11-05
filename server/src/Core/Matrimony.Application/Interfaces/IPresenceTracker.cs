namespace Matrimony.Application.Interfaces;

// Who is online right now (connected to the chat hub). Implemented in the API project (PresenceTracker).
public interface IPresenceTracker
{
    // Returns true if this is the user's FIRST connection (they just came online)
    bool Connected(string userId, string connectionId);

    // Returns true if this was the user's LAST connection (they just went offline)
    bool Disconnected(string userId, string connectionId);

    bool IsOnline(string userId);
}

namespace Matrimony.Application.Interfaces;

// Who is online right now (connected to the chat hub). Implemented in the API project.
public interface IPresenceTracker
{
    bool IsOnline(string userId);
}

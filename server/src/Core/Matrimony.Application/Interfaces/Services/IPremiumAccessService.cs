namespace Matrimony.Application.Interfaces.Services;

// Checks what a member's active plan allows. Implemented by PremiumAccessService.
public interface IPremiumAccessService
{
    Task<bool> CanChatAsync(string userId);
    Task<bool> CanViewContactsAsync(string userId);
    Task<HashSet<string>> UsersWhoCanChatAsync(IEnumerable<string> userIds);
}

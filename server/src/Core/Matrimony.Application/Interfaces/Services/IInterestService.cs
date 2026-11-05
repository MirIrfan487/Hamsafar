using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.Interfaces.Services;

// Send / accept / reject / withdraw interests. Implemented by InterestService (Application/Services).
public interface IInterestService
{
    Task<ServiceResult<InterestResponse>> SendAsync(string userId, SendInterestRequest r);
    Task<ServiceResult<InterestResponse>> RespondAsync(string userId, int interestId, bool accept);
    Task<ServiceResult<InterestResponse>> WithdrawAsync(string userId, int interestId);
    Task<IReadOnlyList<InterestResponse>?> ListAsync(string userId, InterestBox box);
    Task<InterestSummaryResponse?> GetSummaryAsync(string userId);
    Task<InterestBetweenResponse?> FindBetweenAsync(int myId, int otherId);
}

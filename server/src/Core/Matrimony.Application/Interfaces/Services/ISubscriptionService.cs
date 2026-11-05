using Matrimony.Application.Common;
using Matrimony.Application.DTOs;
using Matrimony.Domain.Enums;

namespace Matrimony.Application.Interfaces.Services;

// Plans, Razorpay orders, payment verification, webhooks. Implemented by SubscriptionService (Application/Services).
public interface ISubscriptionService
{
    Task<IReadOnlyList<PlanResponse>> GetPlansAsync();
    Task<MySubscriptionResponse> GetMySubscriptionAsync(string userId);
    Task<ServiceResult<CreateOrderResponse>> CreateOrderAsync(string userId, string planCode);
    Task<ServiceResult<MySubscriptionResponse>> VerifyAsync(string userId, VerifyPaymentRequest r);
    Task<bool> HandleWebhookAsync(string body, string? signature);
}

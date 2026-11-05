using Matrimony.Api.Extensions;
using Matrimony.Application.DTOs;
using Matrimony.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Matrimony.Api.Controllers;

[ApiController]
public class PaymentsController(ISubscriptionService subscriptionService) : ControllerBase
{
    // GET /api/plans — public, for the Plans page
    [AllowAnonymous]
    [HttpGet("api/plans")]
    public async Task<IActionResult> Plans() => Ok(await subscriptionService.GetPlansAsync());

    // GET /api/subscription/me — am I Premium, until when, my payments
    [Authorize]
    [HttpGet("api/subscription/me")]
    public async Task<IActionResult> MySubscription()
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await subscriptionService.GetMySubscriptionAsync(userId));
    }

    // POST /api/payments/order   { "planCode": "PREMIUM_MONTHLY" }
    [Authorize]
    [HttpPost("api/payments/order")]
    public async Task<IActionResult> CreateOrder(CreateOrderRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var result = await subscriptionService.CreateOrderAsync(userId, request.PlanCode);
        return result.Succeeded ? Ok(result.Value) : BadRequest(new { errors = result.Errors });
    }

    // POST /api/payments/verify   { razorpayOrderId, razorpayPaymentId, razorpaySignature }
    [Authorize]
    [HttpPost("api/payments/verify")]
    public async Task<IActionResult> Verify(VerifyPaymentRequest request)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var result = await subscriptionService.VerifyAsync(userId, request);
        return result.Succeeded ? Ok(result.Value) : BadRequest(new { errors = result.Errors });
    }

    // POST /api/payments/webhook — called by Razorpay's servers, not by our app.
    // No login: the X-Razorpay-Signature header proves it really comes from Razorpay.
    [AllowAnonymous]
    [HttpPost("api/payments/webhook")]
    public async Task<IActionResult> Webhook()
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();   // the RAW body is needed for the signature check
        var signature = Request.Headers["X-Razorpay-Signature"].ToString();

        var ok = await subscriptionService.HandleWebhookAsync(body, signature);
        return ok ? Ok() : BadRequest();
    }
}

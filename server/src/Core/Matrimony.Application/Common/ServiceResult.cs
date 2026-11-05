namespace Matrimony.Application.Common;

// A simple "success or list of errors" result that services return to controllers.
// ErrorCode (optional) lets a controller pick the right HTTP status, e.g. 404 or 403.
public record ServiceResult<T>(bool Succeeded, IReadOnlyList<string> Errors, T? Value, string? ErrorCode = null)
{
    public static ServiceResult<T> Ok(T value) => new(true, [], value);
    public static ServiceResult<T> Fail(params string[] errors) => new(false, errors, default);
    public static ServiceResult<T> FailWithCode(string errorCode, string error) => new(false, [error], default, errorCode);
}

public static class ErrorCodes
{
    public const string NotFound = "not_found";
    public const string PremiumRequired = "premium_required";
}

namespace Matrimony.Application.Common;

// A simple "success or list of errors" result that services return to controllers
public record ServiceResult<T>(bool Succeeded, IReadOnlyList<string> Errors, T? Value)
{
    public static ServiceResult<T> Ok(T value) => new(true, [], value);
    public static ServiceResult<T> Fail(params string[] errors) => new(false, errors, default);
}

using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Lendlogic.AnalyzersApi.Common.Extensions;

public static class ResultExtensions
{
    public static IResult ToProblem(this List<Error> errors)
    {
        if (errors.Count == 0)
            return TypedResults.Problem();

        if (errors.All(e => e.Type == ErrorType.Validation))
            return ToValidationProblem(errors);

        return ToSingleProblem(errors[0]);
    }

    public static IResult Match<T>(
        this ErrorOr<T> result,
        Func<T, IResult> onSuccess)
    {
        return result.IsError
            ? result.Errors.ToProblem()
            : onSuccess(result.Value);
    }

    public static IResult MatchCreated<T>(
        this ErrorOr<T> result,
        string uri)
    {
        return result.IsError
            ? result.Errors.ToProblem()
            : TypedResults.Created(uri, result.Value);
    }

    private static IResult ToSingleProblem(Error error)
    {
        var statusCode = error.Type switch
        {
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status500InternalServerError
        };

        return TypedResults.Problem(
            statusCode: statusCode,
            title: error.Code,
            detail: error.Description);
    }

    private static IResult ToValidationProblem(List<Error> errors)
    {
        var errorDictionary = errors
            .GroupBy(e => e.Code)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.Description).ToArray());

        return TypedResults.ValidationProblem(errorDictionary);
    }
}

using ErrorOr;

namespace Lendlogic.AnalyzersApi.Common.Errors;

public static class DomainErrors
{
    public static class General
    {
        public static Error NotFound(string entityName, Guid id) =>
            Error.NotFound(
                code: $"{entityName}.NotFound",
                description: $"{entityName} with id '{id}' was not found.");

        public static Error Duplicate(string entityName, string field, string value) =>
            Error.Conflict(
                code: $"{entityName}.Duplicate",
                description: $"{entityName} with {field} '{value}' already exists.");
    }
}

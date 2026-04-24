using FluentValidation;
using Lendlogic.AnalyzersApi.Services.Storage;
using Microsoft.Extensions.Options;

namespace Lendlogic.AnalyzersApi.Features.Files.Upload;

public sealed class UploadFileValidator : AbstractValidator<UploadFileCommand>
{
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "text/csv",
        "text/plain",
        "application/json",
    };

    public UploadFileValidator(IOptions<FileStorageOptions> storageOptions)
    {
        var maxBytes = storageOptions.Value.MaxBytes;

        RuleFor(x => x.FileName)
            .NotEmpty()
            .MaximumLength(260);

        RuleFor(x => x.ContentType)
            .NotEmpty()
            .Must(ct => AllowedTypes.Contains(ct))
            .WithMessage($"File type is not allowed. Accepted: {string.Join(", ", AllowedTypes)}.");

        RuleFor(x => x.SizeBytes)
            .GreaterThan(0)
            .LessThanOrEqualTo(maxBytes)
            .WithMessage($"File size must be between 1 byte and {maxBytes} bytes.");
    }
}

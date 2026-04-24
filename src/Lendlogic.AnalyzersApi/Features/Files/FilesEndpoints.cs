using Carter;
using Lendlogic.AnalyzersApi.Common.Extensions;
using Lendlogic.AnalyzersApi.Features.Files.Upload;
using Mediator;
using Microsoft.AspNetCore.Http;

namespace Lendlogic.AnalyzersApi.Features.Files;

public class FilesEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/file").WithTags("Files");

        group.MapPost("/upload", async (
            IFormFile file,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            if (file is null)
                return Results.BadRequest(new { error = "File is required." });

            await using var stream = file.OpenReadStream();
            var command = new UploadFileCommand(
                stream,
                file.FileName,
                file.ContentType,
                file.Length);

            var result = await mediator.Send(command, cancellationToken);
            return result.Match(v => Results.Created($"/api/v1/files/{v.FileId}", v));
        })
        .WithName("UploadFile")
        .DisableAntiforgery()
        .Accepts<IFormFile>("multipart/form-data")
        .Produces<UploadFileResponse>(StatusCodes.Status201Created);
    }
}

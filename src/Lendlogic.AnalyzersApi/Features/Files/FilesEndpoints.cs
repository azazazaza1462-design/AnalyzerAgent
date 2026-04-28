using Carter;
using Lendlogic.AnalyzersApi.Common.Auth;
using Lendlogic.AnalyzersApi.Common.Extensions;
using Lendlogic.AnalyzersApi.Features.Files.Download;
using Lendlogic.AnalyzersApi.Features.Files.Upload;
using Mediator;
using Microsoft.AspNetCore.Http;

namespace Lendlogic.AnalyzersApi.Features.Files;

public class FilesEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var uploadGroup = app.MapGroup("/api/v1/file").WithTags("Files");

        uploadGroup.MapPost("/upload", async (
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
        .AllowAnonymous()
        .DisableAntiforgery()
        .Accepts<IFormFile>("multipart/form-data")
        .Produces<UploadFileResponse>(StatusCodes.Status201Created);

        var filesGroup = app.MapGroup("/api/v1/files").WithTags("Files");

        filesGroup.MapGet("/{id:guid}", async (
            Guid id,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new DownloadFileQuery(id), cancellationToken);
            return result.Match(v => Results.File(v.Content, v.ContentType, v.FileName));
        })
        .WithName("DownloadFile")
        .RequireAuthorization(AuthConstants.AuthorizationPolicies.Agent)
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);
    }
}

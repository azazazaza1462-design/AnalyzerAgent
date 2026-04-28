using System.Text.Json;
using Carter;
using Lendlogic.AnalyzersApi.Common.Auth;
using Lendlogic.AnalyzersApi.Common.Extensions;
using Lendlogic.AnalyzersApi.Features.Jobs.Claim;
using Lendlogic.AnalyzersApi.Features.Jobs.Complete;
using Lendlogic.AnalyzersApi.Features.Jobs.Create;
using Lendlogic.AnalyzersApi.Features.Jobs.Fail;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Jobs;

public class JobsEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/jobs").WithTags("Jobs");

        group.MapPost("/", async (
            CreateJobCommand command,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(command, cancellationToken);
            return result.Match(v => Results.Created($"/api/v1/jobs/{v.JobId}", v));
        })
        .WithName("CreateJob")
        .AllowAnonymous()
        .Produces<CreateJobResponse>(StatusCodes.Status201Created);

        group.MapPost("/claim", async (
            ClaimJobCommand command,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(command, cancellationToken);
            return result.Match(v => v.Job is null ? Results.NoContent() : Results.Ok(v.Job));
        })
        .WithName("ClaimJob")
        .RequireAuthorization(AuthConstants.AuthorizationPolicies.Agent)
        .Produces<ClaimedJob>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status204NoContent);

        group.MapPost("/{id:guid}/complete", async (
            Guid id,
            CompleteJobBody body,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new CompleteJobCommand(id, body.ResultData), cancellationToken);
            return result.Match(Results.Ok);
        })
        .WithName("CompleteJob")
        .RequireAuthorization(AuthConstants.AuthorizationPolicies.Agent)
        .Produces<JobCompletedResponse>(StatusCodes.Status200OK);

        group.MapPost("/{id:guid}/fail", async (
            Guid id,
            FailJobBody body,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(
                new FailJobCommand(id, body.Error), cancellationToken);
            return result.Match(Results.Ok);
        })
        .WithName("FailJob")
        .RequireAuthorization(AuthConstants.AuthorizationPolicies.Agent)
        .Produces<JobCompletedResponse>(StatusCodes.Status200OK);
    }
}

public sealed record CompleteJobBody(JsonElement? ResultData);
public sealed record FailJobBody(string? Error);

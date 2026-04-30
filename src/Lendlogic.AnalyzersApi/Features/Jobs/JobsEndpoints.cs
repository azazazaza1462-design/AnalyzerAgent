using System.Text.Json;
using Carter;
using Lendlogic.Analyzers.DataAccess.Enums;
using Lendlogic.AnalyzersApi.Common.Auth;
using Lendlogic.AnalyzersApi.Common.Extensions;
using Lendlogic.AnalyzersApi.Features.Jobs.Cancel;
using Lendlogic.AnalyzersApi.Features.Jobs.Claim;
using Lendlogic.AnalyzersApi.Features.Jobs.Complete;
using Lendlogic.AnalyzersApi.Features.Jobs.Create;
using Lendlogic.AnalyzersApi.Features.Jobs.Fail;
using Lendlogic.AnalyzersApi.Features.Jobs.Get;
using Lendlogic.AnalyzersApi.Features.Jobs.List;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Jobs;

public class JobsEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var env = app.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
        var group = app.MapGroup("/api/v1/jobs").WithTags("Jobs");

        // Until MSAL Entra ID is wired into the frontend, the read endpoints
        // are gated by environment so the team can demo the UI locally
        // without an app registration. Staging and production keep the auth
        // requirement intact.
        var listJobs = group.MapGet("/", async (
            JobStatus? status,
            DateTime? from,
            DateTime? to,
            int? page,
            int? pageSize,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var query = new ListJobsQuery(status, from, to, page ?? 1, pageSize ?? 25);
            var result = await mediator.Send(query, cancellationToken);
            return result.Match(Results.Ok);
        })
        .WithName("ListJobs")
        .Produces<PagedJobs>(StatusCodes.Status200OK);

        var getJob = group.MapGet("/{id:guid}", async (
            Guid id,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new GetJobQuery(id), cancellationToken);
            return result.Match(Results.Ok);
        })
        .WithName("GetJob")
        .Produces<JobDetail>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        var cancelJob = group.MapPost("/{id:guid}/cancel", async (
            Guid id,
            IMediator mediator,
            CancellationToken cancellationToken) =>
        {
            var result = await mediator.Send(new CancelJobCommand(id), cancellationToken);
            return result.Match(_ => Results.NoContent());
        })
        .WithName("CancelJob")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status409Conflict);

        if (env.IsDevelopment())
        {
            listJobs.AllowAnonymous();
            getJob.AllowAnonymous();
            cancelJob.AllowAnonymous();
        }
        else
        {
            listJobs.RequireAuthorization();
            getJob.RequireAuthorization();
            cancelJob.RequireAuthorization();
        }

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

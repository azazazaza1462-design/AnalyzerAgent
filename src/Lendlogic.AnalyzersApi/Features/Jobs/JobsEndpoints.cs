using Carter;
using Lendlogic.AnalyzersApi.Common.Extensions;
using Lendlogic.AnalyzersApi.Features.Jobs.Create;
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
        .Produces<CreateJobResponse>(StatusCodes.Status201Created);
    }
}

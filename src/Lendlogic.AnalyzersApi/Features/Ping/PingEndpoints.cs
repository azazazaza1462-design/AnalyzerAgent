using Carter;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Ping;

public class PingEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/ping", async (IMediator mediator) =>
        {
            var result = await mediator.Send(new PingQuery());
            return Results.Ok(result);
        })
        .WithName("Ping")
        .WithTags("Health")
        .AllowAnonymous()
        .Produces<PingResponse>();
    }
}

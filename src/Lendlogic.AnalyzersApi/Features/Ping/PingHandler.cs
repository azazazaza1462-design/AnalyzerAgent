using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Ping;

public sealed class PingHandler : IQueryHandler<PingQuery, PingResponse>
{
    public ValueTask<PingResponse> Handle(PingQuery query, CancellationToken cancellationToken)
    {
        var response = new PingResponse(
            Message: "pong",
            Timestamp: DateTime.UtcNow);

        return ValueTask.FromResult(response);
    }
}

using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Ping;

public sealed record PingQuery : IQuery<PingResponse>;

public sealed record PingResponse(string Message, DateTime Timestamp);

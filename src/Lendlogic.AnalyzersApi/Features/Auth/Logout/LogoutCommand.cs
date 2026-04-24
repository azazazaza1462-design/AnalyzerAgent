using ErrorOr;
using Mediator;

namespace Lendlogic.AnalyzersApi.Features.Auth.Logout;

public sealed record LogoutCommand(string? RefreshToken) : ICommand<ErrorOr<Success>>;

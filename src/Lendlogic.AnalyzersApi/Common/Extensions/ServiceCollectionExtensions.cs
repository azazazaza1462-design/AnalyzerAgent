using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Carter;
using FluentValidation;
using Lendlogic.AnalyzersApi.Common.Auth;
using Lendlogic.AnalyzersApi.Common.Behaviors;
using Lendlogic.AnalyzersApi.Data;
using Lendlogic.AnalyzersApi.Services.Storage;
using Mediator;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Lendlogic.AnalyzersApi.Common.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCorsPolicy(
        this IServiceCollection services, IConfiguration config, IWebHostEnvironment env)
    {
        services.AddCors(options =>
        {
            var allowedOrigins = config
                .GetSection("Cors:AllowedOrigins")
                .Get<string[]>() ?? [];

            options.AddDefaultPolicy(policy =>
            {
                if (allowedOrigins.Length > 0)
                {
                    policy.WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                }
                else if (env.IsDevelopment())
                {
                    policy.WithOrigins("http://localhost:5173")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                }
                else
                {
                    throw new InvalidOperationException(
                        "Cors:AllowedOrigins must be configured in production.");
                }
            });
        });

        return services;
    }

    public static IServiceCollection AddAuthenticationServices(
        this IServiceCollection services, IConfiguration config)
    {
        services.Configure<JwtOptions>(config.GetSection(JwtOptions.SectionName));
        var jwtOptions = config.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("Jwt configuration section is missing.");

        if (string.IsNullOrWhiteSpace(jwtOptions.Key))
            throw new InvalidOperationException("Jwt:Key is not configured.");

        services.AddSingleton<IEntraTokenValidator, EntraTokenValidator>();
        services.AddScoped<IInternalJwtService, InternalJwtService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.Configure<ApiKeyOptions>(config.GetSection(ApiKeyOptions.SectionName));

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(
                AuthConstants.ApiKey.SchemeName, _ => { })
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOptions.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtOptions.Key)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(jwtOptions.ClockSkewMinutes),
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        // /auth/exchange carries an Entra ID token that is validated
                        // separately by the exchange handler. Skip internal JWT validation.
                        if (context.Request.Path.StartsWithSegments("/api/v1/auth/exchange"))
                        {
                            context.NoResult();
                            return Task.CompletedTask;
                        }

                        context.Token ??= context.Request.Cookies[AuthConstants.Cookies.AccessToken];
                        return Task.CompletedTask;
                    },
                };
            });

        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();

            options.AddPolicy(AuthConstants.AuthorizationPolicies.Agent, policy =>
                policy.AddAuthenticationSchemes(AuthConstants.ApiKey.SchemeName)
                    .RequireAuthenticatedUser()
                    .RequireRole(AuthConstants.Roles.Agent));
        });

        return services;
    }

    public static IServiceCollection AddRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 100,
                        Window = TimeSpan.FromMinutes(1),
                    }));

            options.AddPolicy(AuthConstants.RateLimitPolicies.Auth, context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(1),
                    }));
        });

        return services;
    }

    public static IServiceCollection AddPersistence(
        this IServiceCollection services, IConfiguration config)
    {
        var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(
            config.GetConnectionString("Application"));
        dataSourceBuilder.EnableDynamicJson();
        var dataSource = dataSourceBuilder.Build();

        services.AddSingleton(dataSource); // runtime disposes on shutdown

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(dataSource)
                .UseSnakeCaseNamingConvention();
        });

        return services;
    }

    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services, IConfiguration config, IWebHostEnvironment env)
    {
        // Mediator (source-generated CQRS)
        services.AddMediator(options =>
        {
            options.ServiceLifetime = ServiceLifetime.Scoped;
        });

        // Pipeline behaviors
        services.AddScoped(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddScoped(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        // FluentValidation
        services.AddValidatorsFromAssembly(typeof(Program).Assembly);

        // File storage
        services.Configure<FileStorageOptions>(config.GetSection(FileStorageOptions.SectionName));
        services.AddSingleton<IFileStorage, LocalFileStorage>();

        // JSON: serialize enums as strings (not integers)
        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

        // Carter + Swagger
        services.AddCarter();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
            {
                Title = "Lendlogic Analyzers API",
                Version = "v1"
            });
        });

        return services;
    }
}

using Xunit;

namespace Lendlogic.AnalyzersApi.Tests.Integration.Infrastructure;

[CollectionDefinition("Database")]
public sealed class DatabaseCollection : ICollectionFixture<PostgresFixture>;

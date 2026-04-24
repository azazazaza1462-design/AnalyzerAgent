namespace Lendlogic.AnalyzersApi.Tests.Infrastructure;

[Collection("Database")]
public abstract class IntegrationTestBase(TestDatabaseFixture fixture)
{
    protected TestDatabaseFixture Fixture { get; } = fixture;
}

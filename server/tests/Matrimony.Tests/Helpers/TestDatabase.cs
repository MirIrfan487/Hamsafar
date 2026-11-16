using Matrimony.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Matrimony.Tests.Helpers;

// A real database for one test, living only in memory (SQLite), so every test starts empty
// and nothing touches your SQL Server MatrimonyDb.
// It uses the same AppDbContext and the same table configurations as the real app, so
// unique indexes, foreign keys and check constraints are tested too.
//
// Use NewContext() for each "request": a fresh context does not remember entities from the
// previous one, just like two separate HTTP requests.
public sealed class TestDatabase : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _options;

    public TestDatabase()
    {
        // The in-memory database exists as long as this connection stays open
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        _options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options;

        using var db = NewContext();
        db.Database.EnsureCreated();   // creates all tables from the model (no migrations needed)
    }

    public AppDbContext NewContext() => new(_options);

    public void Dispose() => _connection.Dispose();
}

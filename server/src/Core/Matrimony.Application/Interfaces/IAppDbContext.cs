using Matrimony.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Matrimony.Application.Interfaces;

// What the Application layer needs from the database.
// The real AppDbContext (in Persistence) implements this,
// so services never depend on SQL Server directly.
public interface IAppDbContext
{
    DbSet<Profile> Profiles { get; }
    DbSet<ProfilePhoto> ProfilePhotos { get; }
    DbSet<PartnerPreference> PartnerPreferences { get; }
    DbSet<Interest> Interests { get; }
    DbSet<Conversation> Conversations { get; }
    DbSet<Message> Messages { get; }
    DbSet<SubscriptionPlan> SubscriptionPlans { get; }
    DbSet<Subscription> Subscriptions { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Report> Reports { get; }
    DbSet<Block> Blocks { get; }
    DbSet<AdminAuditLog> AdminAuditLogs { get; }

    DatabaseFacade Database { get; }   // for transactions and connection checks

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

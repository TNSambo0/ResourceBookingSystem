using Microsoft.Extensions.Logging;
using ResourceBookingSystem.Domain.Entities;
using ResourceBookingSystem.Infrastructure.Data;

namespace ResourceBookingSystem.Application.Services
{
    public class AuditService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AuditService> _logger;

        public AuditService(AppDbContext context, ILogger<AuditService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogAsync(string action, string? details = null, string? userId = null)
        {
            try
            {
                var log = new AuditLog
                {
                    Action = action,
                    Details = details,
                    UserId = userId
                };

                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Audit log created: {Action} for user {UserId}", action, userId ?? "Anonymous");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to write audit log for {Action}", action);
            }
        }
    }
}
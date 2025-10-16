using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ResourceBookingSystem.Application.DTOs;
using ResourceBookingSystem.Infrastructure.Data;

namespace ResourceBookingSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize(Roles = "Admin")]
    public class AuditLogsController(AppDbContext context, ILogger<AuditLogsController> logger) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAuditLogs(AuditLogDto auditLogDto)
        {
            try
            {
                var query = context.AuditLogs.AsQueryable();

                if (!string.IsNullOrWhiteSpace(auditLogDto.userId))
                    query = query.Where(a => a.UserId == auditLogDto.userId);

                if (!string.IsNullOrWhiteSpace(auditLogDto.action))
                    query = query.Where(a => a.Action.Contains(auditLogDto.action));

                if (auditLogDto.fromDate.HasValue)
                    query = query.Where(a => a.Timestamp >= auditLogDto.fromDate.Value);

                if (auditLogDto.toDate.HasValue)
                    query = query.Where(a => a.Timestamp <= auditLogDto.toDate.Value);

                var totalCount = await query.CountAsync();

                var logs = await query
                    .OrderByDescending(a => a.Timestamp)
                    .Skip((auditLogDto.page - 1) * auditLogDto.pageSize)
                    .Take(auditLogDto.pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    totalCount,
                    auditLogDto.page,
                    auditLogDto.pageSize,
                    data = logs
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving audit logs");
                return StatusCode(500, new { message = "Error retrieving audit logs" });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetAuditLog(int id)
        {
            try
            {
                var log = await context.AuditLogs.FindAsync(id);
                if (log == null)
                    return NotFound(new { message = $"Audit log {id} not found" });

                return Ok(log);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fetching audit log {Id}", id);
                return StatusCode(500, new { message = "Error retrieving audit log" });
            }
        }

        [HttpDelete("cleanup")]
        public async Task<IActionResult> Cleanup([FromQuery] int olderThanDays = 90)
        {
            try
            {
                var cutoff = DateTime.UtcNow.AddDays(-olderThanDays);
                var oldLogs = context.AuditLogs.Where(a => a.Timestamp < cutoff);

                var count = await oldLogs.CountAsync();
                context.AuditLogs.RemoveRange(oldLogs);
                await context.SaveChangesAsync();

                logger.LogInformation("Cleaned up {Count} audit logs older than {Days} days", count, olderThanDays);
                return Ok(new { message = $"Deleted {count} logs older than {olderThanDays} days." });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error cleaning audit logs");
                return StatusCode(500, new { message = "Error cleaning audit logs" });
            }
        }
    }
}
using System.Text.Json;
using ResourceBookingSystem.Domain.Entities;
using ResourceBookingSystem.Infrastructure.Data;
using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using System.IdentityModel.Tokens.Jwt;

namespace ResourceBookingSystem.API.Middleware
{
    public class AuditMiddleware(RequestDelegate _next, ILogger<AuditMiddleware> _logger)
    {
        public async Task InvokeAsync(HttpContext context, AppDbContext db)
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            string requestBody = string.Empty;
            string userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
              ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
              ?? context.User.FindFirstValue("sub")
              ?? "Anonymous";
            string path = context.Request.Path.ToString();
            string method = context.Request.Method;
            string ipAddress = context.Connection.RemoteIpAddress?.ToString();

            try
            {
                // Capture Request Body (if readable)
                if (context.Request.ContentLength > 0 &&
                    context.Request.ContentType != null &&
                    context.Request.ContentType.Contains("application/json"))
                {
                    context.Request.EnableBuffering();

                    using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
                    var body = await reader.ReadToEndAsync();
                    context.Request.Body.Position = 0;

                    // Mask sensitive data like passwords
                    requestBody = SanitizeRequestBody(body);
                }

                // Capture the response
                var originalBodyStream = context.Response.Body;
                using var responseBody = new MemoryStream();
                context.Response.Body = responseBody;

                await _next(context); // Continue down the pipeline

                stopwatch.Stop();
                context.Response.Body.Seek(0, SeekOrigin.Begin);
                string responseText = await new StreamReader(context.Response.Body).ReadToEndAsync();
                context.Response.Body.Seek(0, SeekOrigin.Begin);

                int statusCode = context.Response.StatusCode;

                // Log entry
                var log = new AuditLog
                {
                    UserId = userId,
                    Action = $"{method} {path}",
                    Details = JsonSerializer.Serialize(new
                    {
                        IP = ipAddress,
                        StatusCode = statusCode,
                        DurationMs = stopwatch.ElapsedMilliseconds,
                        Request = requestBody,
                        Response = Truncate(responseText, 800)
                    }),
                    Timestamp = DateTime.UtcNow
                };

                db.AuditLogs.Add(log);
                await db.SaveChangesAsync();

                _logger.LogInformation(
                    "AUDIT: {Method} {Path} by {UserId} => {Status} ({Duration} ms)",
                    method, path, userId ?? "Anonymous", statusCode, stopwatch.ElapsedMilliseconds
                );

                // Restore original response body
                await responseBody.CopyToAsync(originalBodyStream);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AuditMiddleware while processing {Path}", path);
                await _next(context); // Continue pipeline even if audit fails
            }
        }

        // Helper to prevent logging passwords or long data
        private static string SanitizeRequestBody(string body)
        {
            if (string.IsNullOrWhiteSpace(body))
                return string.Empty;

            try
            {
                var json = JsonSerializer.Deserialize<Dictionary<string, object>>(body);

                if (json == null) return Truncate(body, 400);

                var sensitiveKeys = new[] { "password", "newpassword", "confirmPassword", "token" };

                foreach (var key in sensitiveKeys)
                {
                    if (json.ContainsKey(key))
                        json[key] = "***REDACTED***";
                }

                return JsonSerializer.Serialize(json);
            }
            catch
            {
                // Fallback for non-JSON data
                return Truncate(body, 400);
            }
        }

        private static string Truncate(string input, int maxLength)
        {
            if (string.IsNullOrEmpty(input)) return input;
            return input.Length <= maxLength ? input : input.Substring(0, maxLength) + "...";
        }
    }
}
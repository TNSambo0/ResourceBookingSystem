using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ResourceBookingSystem.Application.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ResourceBookingSystem.Application.Services
{
    public class EmailBackgroundService : BackgroundService
    {
        private readonly IBackgroundTaskQueue _taskQueue;
        private readonly IServiceProvider _services;
        private readonly ILogger<EmailBackgroundService> _logger;

        public EmailBackgroundService(
            IBackgroundTaskQueue taskQueue,
            IServiceProvider services,
            ILogger<EmailBackgroundService> logger)
        {
            _taskQueue = taskQueue;
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Email background worker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                var workItem = await _taskQueue.DequeueAsync(stoppingToken);

                try
                {
                    using var scope = _services.CreateScope();
                    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                    await workItem(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing background email task.");
                }
            }

            _logger.LogInformation("Email background worker stopped.");
        }
    }
}

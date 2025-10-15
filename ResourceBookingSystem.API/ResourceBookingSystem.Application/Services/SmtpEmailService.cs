using Hangfire;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ResourceBookingSystem.Application.Interfaces;
using ResourceBookingSystem.Application.Models;
using ResourceBookingSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace ResourceBookingSystem.Application.Services
{
    public class SmtpEmailService(
        IOptions<EmailOptions> optionsAccessor,
        ILogger<SmtpEmailService> logger,
        IEmailTemplateRenderer templateRenderer) : IEmailService
    {
        private readonly ILogger<SmtpEmailService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        private readonly EmailOptions _options = optionsAccessor?.Value ?? throw new ArgumentNullException(nameof(optionsAccessor));
        private readonly IEmailTemplateRenderer _templateRenderer = templateRenderer ?? throw new ArgumentNullException(nameof(templateRenderer));

        [AutomaticRetry(Attempts = 3, LogEvents = true, OnAttemptsExceeded = AttemptsExceededAction.Fail)]
        public async Task<bool> SendTemplatedEmailAsync<T>(
            string toEmail,
            string subject,
            string templateName,
            T model,
            string? plainTextContent = null,
            IEnumerable<string>? cc = null,
            IEnumerable<string>? bcc = null)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                _logger.LogWarning("Skipping email send — recipient address is empty.");
                return false;
            }

            try
            {
                var htmlContent = await _templateRenderer.RenderTemplateAsync(templateName, model);

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(_options.FromEmail, _options.FromName),
                    Subject = subject,
                    Body = htmlContent,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                if (cc?.Any() == true)
                    foreach (var email in cc) mailMessage.CC.Add(email);

                if (bcc?.Any() == true)
                    foreach (var email in bcc) mailMessage.Bcc.Add(email);

                if (!string.IsNullOrEmpty(plainTextContent))
                {
                    var alternateView = AlternateView.CreateAlternateViewFromString(plainTextContent, null, "text/plain");
                    mailMessage.AlternateViews.Add(alternateView);
                }

                using var smtp = new SmtpClient
                {
                    Host = _options.SmtpHost,
                    Port = _options.SmtpPort,
                    EnableSsl = _options.EnableSsl,
                    Credentials = new NetworkCredential(_options.SmtpUser, _options.SmtpPassword)
                };

                await smtp.SendMailAsync(mailMessage);

                _logger.LogInformation("Email sent successfully to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
                throw; // Hangfire retry logic
            }
        }

        // Background job helpers
        public void QueueJob(ApplicationUser user, EmailTemplate emailModel, string subject = "Password Reset")
        {
            BackgroundJob.Enqueue<IEmailService>(svc =>
                svc.SendTemplatedEmailAsync(
                    user.Email,
                    subject,
                    "BaseTemplate",
                    emailModel,
                    null,
                    null,
                    null
                )
            );
            _logger.LogInformation("Queued email job for {Email}", user.Email);
        }

        public void ScheduleJob(ApplicationUser user, EmailTemplate emailModel, DateTime sendAt, string subject = "Password Reset")
        {
            BackgroundJob.Schedule<IEmailService>(svc =>
                svc.SendTemplatedEmailAsync(
                    user.Email,
                    subject,
                    "BaseTemplate",
                    emailModel,
                    null,
                    null,
                    null
                ), sendAt);
            _logger.LogInformation("Scheduled email to {Email} at {SendAt}", user.Email, sendAt);
        }

        public void DelayJob(ApplicationUser user, EmailTemplate emailModel, TimeSpan delay, string subject = "Password Reset")
        {
            BackgroundJob.Schedule<IEmailService>(svc =>
                svc.SendTemplatedEmailAsync(
                    user.Email,
                    subject,
                    "BaseTemplate",
                    emailModel,
                    null,
                    null,
                    null
                ), delay);
            _logger.LogInformation("Delayed email to {Email} by {Delay}", user.Email, delay);
        }
    }
}

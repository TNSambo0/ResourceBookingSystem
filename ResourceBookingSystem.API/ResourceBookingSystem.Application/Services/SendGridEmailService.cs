using Microsoft.CodeAnalysis.Emit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ResourceBookingSystem.Application.Interfaces;
using ResourceBookingSystem.Application.Models;
using SendGrid;
using SendGrid.Helpers.Mail;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace ResourceBookingSystem.Application.Services
{
    public class SendGridEmailService : IEmailService
    {
        private readonly ILogger<SendGridEmailService> _logger;
        private readonly EmailOptions _options;
        private readonly ISendGridClient _client; 

        public SendGridEmailService(
            IOptions<EmailOptions> optionsAccessor,
            ILogger<SendGridEmailService> logger)
        {
            _options = optionsAccessor?.Value ?? throw new ArgumentNullException(nameof(optionsAccessor));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            if (string.IsNullOrWhiteSpace(_options.SendGridApiKey))
                throw new InvalidOperationException("SendGrid API key is not configured.");

            _client = new SendGridClient(_options.SendGridApiKey);
        }

        public async Task<bool> SendEmailAsync(
            string toEmail,
            string subject,
            string htmlContent,
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
                var from = new EmailAddress(_options.FromEmail, _options.FromName);
                var to = new EmailAddress(toEmail);

                var msg = MailHelper.CreateSingleEmail(
                    from,
                    to,
                    subject,
                    plainTextContent ?? htmlContent,
                    htmlContent
                );

                if (cc?.Any() == true)
                    msg.AddCcs(cc.Select(email => new EmailAddress(email)).ToList());

                if (bcc?.Any() == true)
                    msg.AddBccs(bcc.Select(email => new EmailAddress(email)).ToList());

                msg.SetClickTracking(false, false);

                var response = await _client.SendEmailAsync(msg);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully to {Email}.", toEmail);
                    return true;
                }

                var responseBody = await response.Body.ReadAsStringAsync();
                _logger.LogWarning(
                    "Failed to send email to {Email}. Status: {StatusCode}, Response: {ResponseBody}",
                    toEmail,
                    response.StatusCode,
                    responseBody
                );

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while sending email to {Email}", toEmail);
                return false;
            }
        }
    }
}

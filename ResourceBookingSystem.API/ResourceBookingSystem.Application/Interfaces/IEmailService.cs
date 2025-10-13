using System.Collections.Generic;
using System.Threading.Tasks;

namespace ResourceBookingSystem.Application.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(
            string toEmail,
            string subject,
            string htmlContent,
            string? plainTextContent = null,
            IEnumerable<string>? cc = null,
            IEnumerable<string>? bcc = null);
    }
}

using ResourceBookingSystem.Application.Models;
using ResourceBookingSystem.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ResourceBookingSystem.Application.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendTemplatedEmailAsync<T>(
        string toEmail,
        string subject,
        string templateName,
        T model,
        string? plainTextContent = null,
        IEnumerable<string>? cc = null,
        IEnumerable<string>? bcc = null);

        // Hangfire helpers
        void QueueJob(ApplicationUser user, EmailTemplate emailModel, string subject = "Password Reset");
        void ScheduleJob(ApplicationUser user, EmailTemplate emailModel, DateTime sendAt, string subject = "Password Reset");
        void DelayJob(ApplicationUser user, EmailTemplate emailModel, TimeSpan delay, string subject = "Password Reset");
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ResourceBookingSystem.Application.Interfaces
{
    public interface IEmailTemplateRenderer
    {
        Task<string> RenderTemplateAsync<T>(string templateName, T model);
    }
}

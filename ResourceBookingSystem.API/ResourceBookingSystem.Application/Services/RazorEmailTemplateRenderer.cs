using RazorLight;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using ResourceBookingSystem.Application.Interfaces;

namespace ResourceBookingSystem.Application.Services
{
    public class RazorEmailTemplateRenderer : IEmailTemplateRenderer
    {
        private readonly RazorLightEngine _engine;

        public RazorEmailTemplateRenderer()
        {
            var templatesPath = Path.Combine(
                Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!,
                "EmailTemplates", "Templates");

            _engine = new RazorLightEngineBuilder()
                .UseFileSystemProject(templatesPath)
                .UseMemoryCachingProvider()
                .Build();
        }

        public async Task<string> RenderTemplateAsync<T>(string templateName, T model)
        {
            return await _engine.CompileRenderAsync($"{templateName}.cshtml", model);
        }
    }
}

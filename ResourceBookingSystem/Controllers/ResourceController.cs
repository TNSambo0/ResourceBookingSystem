using InternalResourceBookingSystem.Data;
using Microsoft.AspNetCore.Mvc;

namespace InternalResourceBookingSystem.Controllers
{
    public class ResourceController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ResourceController> _logger;

        public ResourceController(ApplicationDbContext context, ILogger<ResourceController> logger)
        {
            _logger = logger;
            _context = context;
        }
        
    }
}

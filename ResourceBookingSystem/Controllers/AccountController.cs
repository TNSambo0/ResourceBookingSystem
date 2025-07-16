using InternalResourceBookingSystem.Data;
using Microsoft.AspNetCore.Mvc;

namespace InternalResourceBookingSystem.Controllers
{
    public class AccountController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AccountController> _logger;

        public AccountController(ApplicationDbContext context, ILogger<AccountController> logger)
        {
            _logger = logger;
            _context = context;
        }

    }
}

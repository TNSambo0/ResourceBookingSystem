using InternalResourceBookingSystem.Data;
using InternalResourceBookingSystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternalResourceBookingSystem.Controllers
{
    public class BookingController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BookingController> _logger;

        public BookingController(ApplicationDbContext context, ILogger<BookingController> logger)
        {
            _logger = logger;
            _context = context;
        }
        
    }
}

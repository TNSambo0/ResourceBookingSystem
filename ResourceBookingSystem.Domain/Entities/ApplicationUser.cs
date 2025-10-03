using Microsoft.AspNetCore.Identity;

namespace ResourceBookingSystem.Domain.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; }
        public int? DepartmentId { get; set; }
    }
}

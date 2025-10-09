using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ResourceBookingSystem.Domain.Entities
{
    public class Resource
    {
        public int Id { get; set; }
        [Required] 
        public string Name { get; set; }
        public string Description { get; set; }
        public int? DepartmentId { get; set; }
        public Department Department { get; set; }
        public bool RequiresApproval { get; set; } = true;
        public ICollection<Booking> Bookings { get; set; }
    }
}

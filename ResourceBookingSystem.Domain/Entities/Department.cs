using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ResourceBookingSystem.Domain.Entities
{
    public class Department
    {
        public int Id { get; set; }
        [Required] 
        public string Name { get; set; }
        public ICollection<Resource> Resources { get; set; }
    }
}

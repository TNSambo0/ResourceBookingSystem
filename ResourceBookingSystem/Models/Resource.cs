using System.ComponentModel.DataAnnotations;

namespace InternalResourceBookingSystem.Models
{
    public class Resource
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public string Description { get; set; }
        [Required]
        public string Location { get; set; }
        [Range(1, int.MaxValue, ErrorMessage = "Capacity must be positive.")]
        public int Capacity { get; set; }
        [Display(Name = "Is Available")]
        public bool IsAvailable { get; set; }
        public ICollection<Booking> Bookings { get; set; }
    }
}

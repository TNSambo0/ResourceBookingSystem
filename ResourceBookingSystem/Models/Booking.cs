using System.ComponentModel.DataAnnotations;

namespace InternalResourceBookingSystem.Models
{
    public class Booking
    {
        [Key]
        public int Id { get; set; }
        [Required]
        [Display(Name= "Start Time")]
        public DateTime StartTime { get; set; }
        [Required]
        [Display(Name = "End Time")]
        public DateTime EndTime { get; set; }
        
        [Required]
        public string Purpose { get; set; }
        [Required]
        [Display(Name = "Booked by")]
        public string BookedBy { get; set; }
        [Required]
        public string UserId { get; set; }
        public User? User { get; set; }
        [Required]
        public int ResourceId { get; set; }
        public Resource? Resource { get; set; }
    }
}

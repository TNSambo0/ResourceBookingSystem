using ResourceBookingSystem.Domain.Enums;
using System;
using System.ComponentModel.DataAnnotations;

namespace ResourceBookingSystem.Domain.Entities
{
    public class Booking
    {
        public int Id { get; set; }
        [Required]
        public int ResourceId { get; set; }
        public Resource Resource { get; set; }
        [Required] 
        public string RequestedById { get; set; }
        public string ApprovedById { get; set; }
        [Required] 
        public DateTime StartTime { get; set; }
        [Required] 
        public DateTime EndTime { get; set; }
        public BookingStatus Status { get; set; } = BookingStatus.Pending;
        [StringLength(500)] 
        public string Notes { get; set; }
        [StringLength(500)] 
        public string CancelReason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

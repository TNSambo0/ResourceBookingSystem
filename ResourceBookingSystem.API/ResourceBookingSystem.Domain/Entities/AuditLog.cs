using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace ResourceBookingSystem.Domain.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Action { get; set; }
        [Column(TypeName = "nvarchar(max)")]
        public string Details { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}

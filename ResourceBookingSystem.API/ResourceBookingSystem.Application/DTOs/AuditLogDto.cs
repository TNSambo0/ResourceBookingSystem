using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ResourceBookingSystem.Application.DTOs
{
    public class AuditLogDto
    {
        public string? userId { get; set; }
        public string? action { get; set; }
        public DateTime? fromDate { get; set; }
        public DateTime? toDate { get; set; }
        public int page { get; set; } = 1;
        public int pageSize { get; set; } = 20;
    }
}

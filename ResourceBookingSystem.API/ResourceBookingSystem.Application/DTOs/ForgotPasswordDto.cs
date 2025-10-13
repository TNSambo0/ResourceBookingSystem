using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ResourceBookingSystem.Application.DTOs
{
    public class ForgotPasswordDto
    {
        [EmailAddress]
        public string Email { get; set; } 
    }
}

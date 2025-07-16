using System.ComponentModel.DataAnnotations;

namespace InternalResourceBookingSystem.Models
{
    public class User
    {
        public string Id { get; set; }
        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string LastName { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; }
    }

}



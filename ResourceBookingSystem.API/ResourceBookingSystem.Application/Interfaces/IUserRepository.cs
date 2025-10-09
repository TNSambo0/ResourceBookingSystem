using ResourceBookingSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ResourceBookingSystem.Application.Interfaces
{
    public interface IUserRepository
    {
        Task<ApplicationUser> GetByIdAsync(string userId);
    }
}

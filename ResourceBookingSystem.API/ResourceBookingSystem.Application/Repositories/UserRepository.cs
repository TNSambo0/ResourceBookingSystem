using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ResourceBookingSystem.Application.Interfaces;
using ResourceBookingSystem.Domain.Entities;

namespace ResourceBookingSystem.Application.Repositories
{
    public class UserRepository(UserManager<ApplicationUser> _userManager) : IUserRepository
    {
        public async Task<ApplicationUser> GetByIdAsync(string userId) => await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
    }
}

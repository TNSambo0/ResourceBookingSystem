using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ResourceBookingSystem.Application.Interfaces;
using ResourceBookingSystem.Domain.Entities;

namespace ResourceBookingSystem.Application.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UserRepository(UserManager<ApplicationUser> userManager) { _userManager = userManager; }

        public async Task<ApplicationUser> GetByIdAsync(string userId) => await _userManager.Users.FirstOrDefaultAsync(u => u.Id == userId);
    }
}

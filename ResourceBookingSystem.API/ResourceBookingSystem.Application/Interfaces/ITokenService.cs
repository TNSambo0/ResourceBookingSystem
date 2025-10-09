using ResourceBookingSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ResourceBookingSystem.Application.Interfaces
{
    public interface ITokenService
    {
        string GenerateRefreshToken();
        Task<(string token, DateTime expires, string jwtId)> GenerateAccessTokenAsync(ApplicationUser user);
    }
}

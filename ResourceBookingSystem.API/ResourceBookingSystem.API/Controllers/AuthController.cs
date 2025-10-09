using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ResourceBookingSystem.Application.DTOs;
using ResourceBookingSystem.Application.Interfaces;
using ResourceBookingSystem.Domain.Entities;
using ResourceBookingSystem.Infrastructure.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ResourceBookingSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            AppDbContext context,
            ITokenService tokenService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _context = context;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            await _userManager.AddToRoleAsync(user, "Employee");

            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) return Unauthorized("Invalid email or password");

            var valid = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!valid) return Unauthorized("Invalid email or password");

            var (jwtToken, expires, jwtId) = await _tokenService.GenerateAccessTokenAsync(user);

            var refreshToken = new RefreshToken
            {
                JwtId = jwtId,
                Token = _tokenService.GenerateRefreshToken(),
                UserId = user.Id,
                AddedDate = DateTime.UtcNow,
                ExpiryDate = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                token = jwtToken,
                expires,
                refreshToken = refreshToken.Token
            });
        }

        // 👇 Match frontend route `/auth/refresh`
        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest("Refresh token is required");

            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == dto.Token);

            if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiryDate < DateTime.UtcNow)
                return Unauthorized("Invalid or expired refresh token");

            var user = await _userManager.FindByIdAsync(storedToken.UserId);
            if (user == null)
                return Unauthorized("User not found");

            // Revoke the old refresh token
            storedToken.IsRevoked = true;

            // Generate new tokens
            var (newJwt, expires, jwtId) = await _tokenService.GenerateAccessTokenAsync(user);

            var newRefreshToken = new RefreshToken
            {
                JwtId = jwtId,
                Token = _tokenService.GenerateRefreshToken(),
                UserId = user.Id,
                AddedDate = DateTime.UtcNow,
                ExpiryDate = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };

            _context.RefreshTokens.Add(newRefreshToken);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                token = newJwt,
                expires,
                refreshToken = newRefreshToken.Token
            });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto dto)
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (userId == null) return Unauthorized();

            var token = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == dto.Token && rt.UserId == userId);

            if (token == null)
                return NotFound("Refresh token not found");

            if (token.IsRevoked)
                return BadRequest("Refresh token already revoked");

            token.IsRevoked = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Logged out from current session" });
        }

        [Authorize]
        [HttpPost("logout-all")]
        public async Task<IActionResult> LogoutAll()
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (userId == null) return Unauthorized();

            var tokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && !rt.IsRevoked)
                .ToListAsync();

            foreach (var rt in tokens)
                rt.IsRevoked = true;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Logged out from all sessions" });
        }
    }
}

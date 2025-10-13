using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ResourceBookingSystem.Application.DTOs;
using ResourceBookingSystem.Application.EmailTemplates;
using ResourceBookingSystem.Application.Interfaces;
using ResourceBookingSystem.Application.Models;
using ResourceBookingSystem.Application.Services;
using ResourceBookingSystem.Domain.Entities;
using ResourceBookingSystem.Infrastructure.Data;
using System.Security.Claims;
using System.Text;

namespace ResourceBookingSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(
        UserManager<ApplicationUser> userManager,
        AppDbContext context,
        ITokenService tokenService,
        IEmailTemplateRenderer templateRenderer,
        ILogger<AuthController> logger) : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager = userManager;
        private readonly AppDbContext _context = context;
        private readonly ITokenService _tokenService = tokenService;
        private readonly IEmailTemplateRenderer _templateRenderer = templateRenderer;
        private readonly ILogger<AuthController> _logger = logger;

        // Forgot Password
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(
            [FromBody] ForgotPasswordDto request,
            [FromServices] IBackgroundTaskQueue taskQueue,
            [FromServices] IServiceProvider serviceProvider)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return Ok(new { message = "If the email exists, a reset link has been sent." });

            var code = await _userManager.GeneratePasswordResetTokenAsync(user);
            code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));
            var callbackUrl = $"{Request.Scheme}://{Request.Host}/reset-password?code={code}&email={Uri.EscapeDataString(request.Email)}";

            var emailModel = new EmailTemplate
            {
                Title = "Reset Your Password",
                Greeting = $"Hello {user.UserName},",
                BodyContent = "Click below to reset your password.",
                ActionText = "Reset Password",
                ActionUrl = callbackUrl
            };

            var htmlMessage = await _templateRenderer.RenderTemplateAsync("BaseTemplate", emailModel);

            await taskQueue.QueueBackgroundWorkItemAsync(async token =>
            {
                using var scope = serviceProvider.CreateScope();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                await emailService.SendEmailAsync(request.Email, "Reset Password", htmlMessage);
            });

            return Ok(new { message = "Password reset link queued for sending." });
        }

        // Reset Password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token))
                return BadRequest(new { message = "Invalid reset request." });

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return BadRequest(new { message = "Invalid user." });

            var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));
            var result = await _userManager.ResetPasswordAsync(user, decodedToken, request.NewPassword);

            if (result.Succeeded)
                return Ok(new { message = "Password has been reset successfully." });

            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        // Register
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

        // Login
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
                refreshToken = refreshToken.Token,
                userData = user
            });
        }

        // Refresh Token
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

            // Revoke old token
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
                user,
                token = newJwt,
                expires,
                refreshToken = newRefreshToken.Token
            });
        }

        // Logout
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
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
    }
}

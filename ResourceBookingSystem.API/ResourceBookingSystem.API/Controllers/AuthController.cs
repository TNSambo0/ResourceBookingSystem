using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using ResourceBookingSystem.Application.DTOs;
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
    public class AuthController(UserManager<ApplicationUser> userManager,
    AppDbContext context,
    ITokenService tokenService,
    ILogger<AuthController> logger,
    IEmailService emailService,
    IConfiguration builder) : ControllerBase
    {

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request)
        {
            logger.LogInformation("Password reset requested for {Email}", request.Email);

            try
            {
                var user = await userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    logger.LogWarning("Password reset requested for non-existent email: {Email}", request.Email);
                    return Ok(new { message = "If the email exists, a reset link has been sent." });
                }

                var code = await userManager.GeneratePasswordResetTokenAsync(user);
                code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));

                var frontendUrl = builder.GetValue<string>("FrontendUrl") ?? "http://localhost:5173";
                var callbackUrl = $"{frontendUrl}/reset-password?code={code}&email={Uri.EscapeDataString(request.Email)}";

                var emailModel = new EmailTemplate
                {
                    Title = "Reset Your Password",
                    Greeting = $"Hello {user.FullName},",
                    BodyContent = "Click below to reset your password.",
                    ActionText = "Reset Password",
                    ActionUrl = callbackUrl
                };

                emailService.QueueJob(user, emailModel);
                logger.LogInformation("Password reset email queued successfully for {Email}", request.Email);

                return Ok(new { message = "Password reset link queued for sending." });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error while processing password reset request for {Email}", request.Email);
                return StatusCode(500, new { message = "An error occurred while processing your request." });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
        {
            logger.LogInformation("Password reset attempt for {Email}", request.Email);

            try
            {
                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token))
                {
                    logger.LogWarning("Invalid password reset request received (missing email or token)");
                    return BadRequest(new { message = "Invalid reset request." });
                }

                var user = await userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    logger.LogWarning("Password reset failed — user not found for email {Email}", request.Email);
                    return BadRequest(new { message = "Invalid user." });
                }

                var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));
                var result = await userManager.ResetPasswordAsync(user, decodedToken, request.NewPassword);

                if (result.Succeeded)
                {
                    logger.LogInformation("Password reset successful for {Email}", request.Email);
                    return Ok(new { message = "Password has been reset successfully." });
                }

                logger.LogWarning("Password reset failed for {Email}: {Errors}",
                    request.Email, string.Join(", ", result.Errors.Select(e => e.Description)));

                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
            }
            catch (FormatException fe)
            {
                logger.LogError(fe, "Token decoding failed for {Email}", request.Email);
                return BadRequest(new { message = "Invalid token format." });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error while resetting password for {Email}", request.Email);
                return StatusCode(500, new { message = "An error occurred while resetting password." });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            logger.LogInformation("Registration attempt for {Email}", dto.Email);

            try
            {
                var user = new ApplicationUser
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    FullName = dto.FullName
                };

                var result = await userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded)
                {
                    logger.LogWarning("Registration failed for {Email}: {Errors}",
                        dto.Email, string.Join(", ", result.Errors.Select(e => e.Description)));
                    return BadRequest(result.Errors);
                }

                await userManager.AddToRoleAsync(user, "Employee");
                logger.LogInformation("User {Email} registered successfully", dto.Email);

                return Ok(new { message = "User registered successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred during registration for {Email}", dto.Email);
                return StatusCode(500, new { message = "An error occurred while registering user." });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            logger.LogInformation("Login attempt for {Email}", dto.Email);

            try
            {
                var user = await userManager.FindByEmailAsync(dto.Email);
                if (user == null)
                {
                    logger.LogWarning("Login failed — user not found for {Email}", dto.Email);
                    return Unauthorized("Invalid email or password");
                }

                var valid = await userManager.CheckPasswordAsync(user, dto.Password);
                if (!valid)
                {
                    logger.LogWarning("Login failed — invalid password for {Email}", dto.Email);
                    return Unauthorized("Invalid email or password");
                }

                var (jwtToken, expires, jwtId) = await tokenService.GenerateAccessTokenAsync(user);

                var refreshToken = new RefreshToken
                {
                    JwtId = jwtId,
                    Token = tokenService.GenerateRefreshToken(),
                    UserId = user.Id,
                    AddedDate = DateTime.UtcNow,
                    ExpiryDate = DateTime.UtcNow.AddDays(7),
                    IsRevoked = false
                };

                context.RefreshTokens.Add(refreshToken);
                await context.SaveChangesAsync();

                logger.LogInformation("User {Email} logged in successfully", dto.Email);

                return Ok(new
                {
                    token = jwtToken,
                    expires,
                    refreshToken = refreshToken.Token,
                    userData = user
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred during login for {Email}", dto.Email);
                return StatusCode(500, new { message = "An error occurred while logging in." });
            }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
        {
            logger.LogInformation("Refresh token request received");

            try
            {
                if (string.IsNullOrWhiteSpace(dto.Token))
                {
                    logger.LogWarning("Refresh token missing in request");
                    return BadRequest("Refresh token is required");
                }

                var storedToken = await context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == dto.Token);

                if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiryDate < DateTime.UtcNow)
                {
                    logger.LogWarning("Invalid or expired refresh token");
                    return Unauthorized("Invalid or expired refresh token");
                }

                var user = await userManager.FindByIdAsync(storedToken.UserId);
                if (user == null)
                {
                    logger.LogWarning("User not found for refresh token");
                    return Unauthorized("User not found");
                }

                storedToken.IsRevoked = true;

                var (newJwt, expires, jwtId) = await tokenService.GenerateAccessTokenAsync(user);
                var newRefreshToken = new RefreshToken
                {
                    JwtId = jwtId,
                    Token = tokenService.GenerateRefreshToken(),
                    UserId = user.Id,
                    AddedDate = DateTime.UtcNow,
                    ExpiryDate = DateTime.UtcNow.AddDays(7),
                    IsRevoked = false
                };

                context.RefreshTokens.Add(newRefreshToken);
                await context.SaveChangesAsync();

                logger.LogInformation("Tokens refreshed for {Email}", user.Email);

                return Ok(new
                {
                    user,
                    token = newJwt,
                    expires,
                    refreshToken = newRefreshToken.Token
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred during token refresh");
                return StatusCode(500, new { message = "An error occurred while refreshing token." });
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId == null)
                {
                    logger.LogWarning("Logout attempt without valid user claim");
                    return Unauthorized();
                }

                var token = await context.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Token == dto.Token && rt.UserId == userId);

                if (token == null)
                {
                    logger.LogWarning("Logout failed — token not found for user {UserId}", userId);
                    return NotFound("Refresh token not found");
                }

                if (token.IsRevoked)
                {
                    logger.LogWarning("Logout failed — token already revoked for user {UserId}", userId);
                    return BadRequest("Refresh token already revoked");
                }

                token.IsRevoked = true;
                await context.SaveChangesAsync();

                logger.LogInformation("User {UserId} logged out successfully", userId);

                return Ok(new { message = "Logged out from current session" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred during logout");
                return StatusCode(500, new { message = "An error occurred while logging out." });
            }
        }
    }
}

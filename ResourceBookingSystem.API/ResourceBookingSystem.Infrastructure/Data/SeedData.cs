using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using ResourceBookingSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ResourceBookingSystem.Infrastructure.Data
{
    public class SeedData
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            var roles = new[] { "Admin", "Manager", "Employee", "Customer" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                    await roleManager.CreateAsync(new IdentityRole(role));
            }

            var usersToSeed = new List<(string FullName, string Email, string Password, string Role)>
            {
                ("System Admin", "admin@local.co.za", "Admin@12345", "Admin"),
                ("Tsepo Sambo", "christy4a.m@gmail.com", "Admin@12345", "Admin"),
                ("HR Manager", "manager@local.co.za", "Manager@12345", "Manager"),
                ("John Employee", "employee@local.co.za", "Employee@12345", "Employee"),
                ("Jane Customer", "customer@local.co.za", "Customer@12345", "Customer"),
            };

            foreach (var (fullName, email, password, role) in usersToSeed)
            {
                var user = await userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    user = new ApplicationUser
                    {
                        UserName = email,
                        Email = email,
                        FullName = fullName,
                        EmailConfirmed = true
                    };

                    var createResult = await userManager.CreateAsync(user, password);
                    if (!createResult.Succeeded)
                    {
                        var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                        throw new Exception($"Failed to create user '{email}': {errors}");
                    }
                }

                // Assign role if not assigned
                var rolesForUser = await userManager.GetRolesAsync(user);
                if (!rolesForUser.Contains(role))
                {
                    await userManager.AddToRoleAsync(user, role);
                }
            }
        }
    }
}

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ResourceBookingSystem.Application.EmailTemplates;
using ResourceBookingSystem.Application.Interfaces;
using ResourceBookingSystem.Application.Models;
using ResourceBookingSystem.Application.Repositories;
using ResourceBookingSystem.Application.Services;
using ResourceBookingSystem.Domain.Entities;
using ResourceBookingSystem.Infrastructure.Data;
using Serilog;
using Hangfire;
using Hangfire.SqlServer;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("Logs/log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

const string AllowedOrigins = "_allowedOrigins";

//  Environment Variables / GitHub Secrets
var connectionString = builder.Configuration["DB_CONNECTION_STRING"]
                     ?? builder.Configuration.GetConnectionString("DefaultConnection")
                     ?? Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
                     ?? throw new InvalidOperationException("Database connection string not found.");

var jwtKey = builder.Configuration["JWT_SECRET"]
              ?? builder.Configuration["Jwt:Key"]
              ?? Environment.GetEnvironmentVariable("JWT_SECRET")
              ?? throw new InvalidOperationException("JWT key not configured.");


// EF Core + Identity
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Configure Hangfire with your connection string
builder.Services.AddHangfire(config =>
    config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
          .UseSimpleAssemblyNameTypeSerializer()
          .UseRecommendedSerializerSettings()
          .UseSqlServerStorage(
              connectionString,
              new SqlServerStorageOptions
              {
                  SchemaName = "HangFire",
                  PrepareSchemaIfNecessary = true // creates tables automatically
              })
);

// Add Hangfire server
builder.Services.AddHangfireServer();

// JWT Authentication
var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: AllowedOrigins, policy =>
    {
        policy
            .WithOrigins("http://localhost:5173") // Frontend dev origin
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ResourceBookingSystem API",
        Version = "v1",
        Description = "API documentation for the Resource Booking System"
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme."
    };

    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

// Application Services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserContextService, UserContextService>();
builder.Services.AddScoped<ITokenService, TokenService>();

// Email configuration
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("EmailOptions"));
builder.Services.AddScoped<IEmailTemplateRenderer, RazorEmailTemplateRenderer>();
builder.Services.AddTransient<IEmailService, SmtpEmailService>();


builder.Services.AddHttpContextAccessor();

// Build & Run App
var app = builder.Build();

app.UseCors(AllowedOrigins);
app.UseSerilogRequestLogging();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ResourceBookingSystem API v1");
        c.RoutePrefix = "swagger";
    });
}

// Hangfire dashboard (optional but useful)
app.UseHangfireDashboard("/hangfire");

// Seed roles and initial data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await SeedData.SeedAsync(services);
}

app.MapControllers();
app.MapGet("/", () => Results.Ok("ResourceBookingSystem API is running."));

app.Run();

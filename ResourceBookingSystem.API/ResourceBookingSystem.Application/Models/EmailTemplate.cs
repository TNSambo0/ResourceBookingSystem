namespace ResourceBookingSystem.Application.Models
{
    public class EmailTemplate
    {
        public string CompanyName { get; set; }
        public string CompanyLogoUrl { get; set; }
        public string CompanyWebsite { get; set; }
        public string Title { get; set; }
        public string Greeting { get; set; }
        public string BodyContent { get; set; }
        public string ActionText { get; set; }
        public string ActionUrl { get; set; }
        public string FooterNote { get; set; }
        public string SupportEmail { get; set; }
        public int CurrentYear { get; set; } = DateTime.UtcNow.Year;
    }
}

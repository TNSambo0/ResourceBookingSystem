using ResourceBookingSystem.Application.Models;
using System.Text;

namespace ResourceBookingSystem.Application.Services
{
    public static class EmailTemplateBuilder
    {
        public static string BuildHtmlTemplate(EmailTemplate model)
        {
            var sb = new StringBuilder();

            sb.Append($@"
                <!DOCTYPE html>
                <html lang='en'>
                <head>
                    <meta charset='UTF-8' />
                    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
                    <title>{model.Title}</title>
                    <style>
                        body {{
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background-color: #f8f9fa;
                            color: #333;
                            padding: 0;
                            margin: 0;
                        }}
                        .container {{
                            max-width: 600px;
                            margin: 40px auto;
                            background-color: #ffffff;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }}
                        .header {{
                            background-color: #004aad;
                            color: #fff;
                            text-align: center;
                            padding: 20px;
                        }}
                        .header img {{
                            max-height: 60px;
                            margin-bottom: 10px;
                        }}
                        .content {{
                            padding: 30px;
                        }}
                        .content h2 {{
                            color: #004aad;
                            margin-bottom: 15px;
                        }}
                        .cta-button {{
                            display: inline-block;
                            background-color: #004aad;
                            color: #fff !important;
                            text-decoration: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            margin-top: 20px;
                        }}
                        .footer {{
                            background-color: #f1f3f5;
                            text-align: center;
                            font-size: 12px;
                            color: #666;
                            padding: 15px;
                        }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <img src='{model.CompanyLogoUrl}' alt='{model.CompanyName} Logo' />
                            <h1>{model.CompanyName}</h1>
                        </div>
                        <div class='content'>
                            <h2>{model.Title}</h2>
                            <p>{model.Greeting},</p>
                            <p>{model.BodyContent}</p>");

                            if (!string.IsNullOrEmpty(model.ActionUrl) && !string.IsNullOrEmpty(model.ActionText))
                            {
                                sb.Append($@"
                            <p style='text-align:center;'>
                                <a href='{model.ActionUrl}' class='cta-button'>{model.ActionText}</a>
                            </p>");
                            }

                            sb.Append($@"
                            <p>{model.FooterNote}</p>
                        </div>
                        <div class='footer'>
                            <p>Need help? Contact us at <a href='mailto:{model.SupportEmail}'>{model.SupportEmail}</a></p>
                            <p>&copy; {DateTime.UtcNow.Year} {model.CompanyName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>");

            return sb.ToString();
        }
    }
}

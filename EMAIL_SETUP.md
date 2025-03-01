# Email Setup for Youversity Contact Form

This document provides instructions on how to set up the email functionality for the Youversity contact form.

## Zoho Mail Setup

The contact form uses Nodemailer with Zoho Mail to send emails from the server.

### Configuration Steps:

1. Open the `.env` file in the root directory of the project.
2. Update the following variables with your Zoho Mail credentials:
   ```
   VITE_EMAIL_USER=team@youversity.io
   VITE_EMAIL_PASS=your_zoho_mail_password
   ```
3. If you have two-factor authentication enabled on your Zoho Mail account, you'll need to generate an app-specific password.

### Zoho Mail SMTP Settings:

- **Host**: smtp.zoho.com
- **Port**: 465
- **Secure**: true (uses SSL)

## Implementation Details

The contact form in `ContactTab.svelte` sends form data to the server endpoint at `/api/contact`, which uses Nodemailer to send an email to team@youversity.io.

## Troubleshooting

### Common Issues with Zoho Mail:

1. **Authentication Failed**: Ensure your password is correct. If using two-factor authentication, use an app-specific password.
2. **Connection Refused**: Check if your Zoho Mail account allows SMTP access. You may need to enable it in your account settings.
3. **Sender Address Rejected**: The `from` address in the email must match your Zoho Mail address.

## Security Considerations

- Never commit your email passwords or API keys to version control.
- Use environment variables for sensitive information.
- Consider implementing rate limiting to prevent abuse of the contact form. 
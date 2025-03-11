import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import nodemailer from 'nodemailer';

const verifyRecaptcha = async (token: string) => {
  const RECAPTCHA_SECRET_KEY = import.meta.env.VITE_RECAPTCHA_SECRET_KEY;
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { firstName, lastName, email, message, recaptchaToken } = await request.json();

    // Validate input
    if (!firstName || !lastName || !email || !message) {
      return json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    // Verify reCAPTCHA
    if (!recaptchaToken) {
      return json({ success: false, message: 'reCAPTCHA verification required' }, { status: 400 });
    }

    const isValidCaptcha = await verifyRecaptcha(recaptchaToken);
    if (!isValidCaptcha) {
      return json({ success: false, message: 'reCAPTCHA verification failed' }, { status: 400 });
    }

    // Create a transporter for Zoho Mail
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: import.meta.env.VITE_EMAIL_USER, // Use environment variables for security
        pass: import.meta.env.VITE_EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: `"Youversity Contact Form" <${import.meta.env.VITE_EMAIL_USER}>`, // Sender's email (must be your Zoho email)
      replyTo: email, // Set reply-to as the user's email
      to: 'team@youversity.io', // Recipient's email
      subject: `Contact Form Submission from ${firstName} ${lastName}`,
      text: `
        Name: ${firstName} ${lastName}
        Email: ${email}
        
        Message:
        ${message}
      `,
      html: `
        <h2>Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <h3>Message:</h3>
        <p>${message}</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return json(
      { success: false, message: 'Failed to send email', error: String(error) },
      { status: 500 }
    );
  }
}; 
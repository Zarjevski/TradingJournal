/**
 * Email utility functions
 * 
 * For production use, configure one of these email services:
 * - SendGrid: https://sendgrid.com/
 * - Resend: https://resend.com/
 * - AWS SES: https://aws.amazon.com/ses/
 * - Nodemailer with SMTP
 * 
 * For now, this is a placeholder that logs the email content.
 * In development, the reset URL is logged to the console.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // TODO: Implement actual email sending
  // Example with Nodemailer:
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: parseInt(process.env.SMTP_PORT || "587"),
  //   secure: false,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASSWORD,
  //   },
  // });
  // 
  // await transporter.sendMail({
  //   from: process.env.SMTP_FROM,
  //   ...options,
  // });

  // For development, log the email
  if (process.env.NODE_ENV === "development") {
    console.log("=".repeat(50));
    console.log("EMAIL (Development Mode)");
    console.log("=".repeat(50));
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("HTML:", options.html);
    console.log("=".repeat(50));
  }

  // In production, throw an error if email is not configured
  if (process.env.NODE_ENV === "production" && !process.env.SMTP_HOST) {
    throw new Error("Email service not configured");
  }
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetUrl: string
): Promise<void> {
  const subject = "Reset Your Trading Journal Password";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Trading Journal</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${firstName},</h2>
          <p>We received a request to reset your password for your Trading Journal account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} Trading Journal. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hello ${firstName},

We received a request to reset your password for your Trading Journal account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} Trading Journal. All rights reserved.
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

import nodemailer from 'nodemailer';

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

if (!user || !pass) {
  console.warn(
    '[WARN] GMAIL_USER or GMAIL_APP_PASSWORD is missing in server/.env. Emails will not send.'
  );
}

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user,
    pass,
  },
});

/**
 * Sends the 6-digit OTP to the user's email.
 * Note: Never log the plain OTP in console or audit logs!
 */
export async function sendOtpEmail(toEmail, otp) {
  const mailOptions = {
    from: `"Auth Service" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Login Verification Code',
    text: `Your one-time login code is: ${otp}\n\nThis code will expire in 5 minutes. If you did not request this code, please ignore this email.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Your Verification Code</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.5;">
          Use the following 6-digit verification code to complete your sign-in:
        </p>
        <div style="margin: 24px 0; text-align: center;">
          <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 12px 24px; background-color: #f1f5f9; border-radius: 6px; color: #0f172a; font-family: monospace;">
            ${otp}
          </span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          This code is valid for <strong>5 minutes</strong>. Never share this code with anyone.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          If you did not request this login attempt, you can safely ignore this message.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

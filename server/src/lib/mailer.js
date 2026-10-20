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
  const repoUrl = 'https://github.com/maneshkatthi/OTPost';
  
  const mailOptions = {
    from: `"OTPost Authentication" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `${otp} is your OTPost verification code`,
    text: `Your OTPost one-time login code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you find OTPost helpful, please star our repo on GitHub: ${repoUrl}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #090a10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090a10; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 520px; background-color: #12131d; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);" cellspacing="0" cellpadding="0">
                <!-- Top Accent Line -->
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, #5b6bf0 0%, #06d6d6 50%, #a855f7 100%);"></td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 36px 32px;">
                    <!-- Brand Header -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                      <tr>
                        <td>
                          <span style="font-size: 26px; vertical-align: middle;">📬</span>
                          <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; margin-left: 8px; vertical-align: middle;">OTPost</span>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #06d6d6; background-color: rgba(6, 214, 214, 0.1); border: 1px solid rgba(6, 214, 214, 0.25); padding: 4px 10px; border-radius: 20px;">
                            Gmail SMTP
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Headline -->
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.3px;">
                      Your Login Verification Code
                    </h1>
                    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                      Use the 6-digit code below to securely complete your sign-in. This code was generated just for you and expires in <strong>5 minutes</strong>.
                    </p>

                    <!-- OTP Code Card -->
                    <div style="background: linear-gradient(135deg, rgba(91, 107, 240, 0.12) 0%, rgba(6, 214, 214, 0.06) 100%); border: 1.5px solid #5b6bf0; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 24px;">
                      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #a0b4fb; font-weight: 600; margin-bottom: 8px;">
                        One-Time Passcode
                      </div>
                      <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', Courier, monospace; margin: 4px 0 10px 0;">
                        ${otp}
                      </div>
                      <div style="font-size: 12px; color: #94a3b8;">
                        🔒 Single-use only · Expires in 5 minutes
                      </div>
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 28px 0;">
                      If you did not request this login attempt, someone may have typed your email address by mistake. No action is required and your account remains secure.
                    </p>

                    <!-- Star the Repo Banner -->
                    <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 12px;">
                      <div style="font-size: 14px; font-weight: 600; color: #f1f5f9; margin-bottom: 4px;">
                        ⭐ Star OTPost on GitHub
                      </div>
                      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0 0 14px 0;">
                        This email was sent for free with OTPost using Gmail SMTP. If this project helped you, please give it a star!
                      </p>
                      <a href="${repoUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 8px 18px; border-radius: 8px; box-shadow: 0 2px 10px rgba(245, 158, 11, 0.35);">
                        ⭐ Star on GitHub (${repoUrl.replace('https://github.com/', '')})
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #0c0d14; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
                    <p style="color: #475569; font-size: 11px; margin: 0; line-height: 1.5;">
                      Powered by <strong>OTPost</strong> — Free &amp; Unlimited OTP Engine.<br>
                      <a href="${repoUrl}" style="color: #7a8ef7; text-decoration: none;">github.com/maneshkatthi/OTPost</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}

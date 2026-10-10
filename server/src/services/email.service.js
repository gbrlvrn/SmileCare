const nodemailer = require('nodemailer');

/**
 * Creates and caches a Nodemailer transport instance.
 * Supports custom SMTP, Gmail, or a fallback dev logger when credentials are not yet configured.
 */
let transporter = null;

const timeoutOptions = {
  connectionTimeout: 5000, // 5s connection timeout (prevents hanging if host blocks SMTP)
  greetingTimeout: 5000,
  socketTimeout: 5000,
};

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const service = process.env.EMAIL_SERVICE?.toLowerCase();

  if (!user || !pass) {
    return null;
  }

  const cleanUser = user.trim();
  const cleanPass = pass.replace(/\s+/g, ''); // Handles Google App Passwords copied with spaces

  // Gmail: use smtp.gmail.com with SSL (port 465)
  if (service === 'gmail' || (!host && cleanUser.toLowerCase().endsWith('@gmail.com'))) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      ...timeoutOptions,
    });
  } else if (service === 'yahoo' || (!host && cleanUser.toLowerCase().endsWith('@yahoo.com'))) {
    transporter = nodemailer.createTransport({
      service: 'yahoo',
      auth: { user: cleanUser, pass: cleanPass },
      ...timeoutOptions,
    });
  } else if (
    service === 'hotmail' ||
    service === 'outlook' ||
    (!host && (cleanUser.toLowerCase().endsWith('@outlook.com') || cleanUser.toLowerCase().endsWith('@hotmail.com')))
  ) {
    transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: { user: cleanUser, pass: cleanPass },
      ...timeoutOptions,
    });
  } else if (host) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: cleanUser, pass: cleanPass },
      ...timeoutOptions,
    });
  }

  return transporter;
}

/**
 * Sends email via Resend REST API (HTTPS port 443).
 * Ideal for cloud platforms like Render Free Tier that block outbound SMTP ports (25, 465, 587).
 */
async function sendViaResend({ to, firstName, otp, expiresInMinutes, fromAddress, subject, html }) {
  const resendFrom = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'SmileCare <onboarding@resend.dev>';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [to],
      subject,
      html,
      text: `Hello ${firstName},\n\nYour SmileCare verification code is: ${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nThank you,\nSmileCare Dental Clinic`,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend API HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  console.log(`[EmailService] OTP email successfully sent via Resend API to ${to} (ID: ${data.id})`);
  return { success: true, messageId: data.id };
}

/**
 * Sends email via Brevo REST API (HTTPS port 443).
 * Ideal for cloud platforms like Render Free Tier: sends to ANY recipient email without requiring a custom domain.
 */
async function sendViaBrevo({ to, firstName, otp, expiresInMinutes, subject, html }) {
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'gabrielvarona06@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'SmileCare Dental';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY.trim(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail.trim(),
      },
      to: [
        {
          email: to.trim(),
          name: firstName || 'Patient',
        },
      ],
      subject,
      htmlContent: html,
      textContent: `Hello ${firstName},\n\nYour SmileCare verification code is: ${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nThank you,\nSmileCare Dental Clinic`,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Brevo API HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  console.log(`[EmailService] OTP email successfully sent via Brevo API to ${to} (Message ID: ${data.messageId})`);
  return { success: true, messageId: data.messageId };
}

/**
 * Sends email via a free Google Apps Script Webhook (HTTPS port 443).
 * Uses your personal Gmail to deliver to ANY recipient email worldwide.
 * 100% free forever, no domain required, no credit card required.
 */
async function sendViaGoogleAppsScript({ to, firstName, otp, expiresInMinutes, subject, html }) {
  const url = process.env.GMAIL_WEBHOOK_URL?.trim();
  if (!url) return null;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: to.trim(),
      subject,
      html,
      firstName,
      otp,
      expiresInMinutes,
    }),
    redirect: 'follow',
  });

  const text = await response.text();
  console.log(`[EmailService] OTP email sent via Google Apps Script to ${to}: ${text}`);
  return { success: true };
}

/**
 * Sends a 6-digit registration OTP email to the user.
 *
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.firstName - User's first name
 * @param {string} params.otp - 6-digit OTP string
 * @param {number} [params.expiresInMinutes=10]
 */
async function sendOtpEmail({ to, firstName, otp, expiresInMinutes = 10 }) {
  const fromAddress = process.env.EMAIL_FROM || '"SmileCare Clinic" <no-reply@smilecare.com>';
  const subject = `${otp} is your SmileCare verification code`;

  // Always log in terminal for quick debugging and local development
  console.log('\n=======================================================');
  console.log(`[SMILECARE OTP EMAIL]`);
  console.log(`To: ${to} (${firstName})`);
  console.log(`Verification Code: ${otp}`);
  console.log(`Expires in: ${expiresInMinutes} minutes`);
  console.log('=======================================================\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SmileCare Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fb; padding: 40px 15px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 27, 45, 0.08); border: 1px solid #e2e8f0;">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e6fe8 0%, #104ba3 100%); padding: 32px 24px; text-align: center;">
                    <div style="font-size: 28px; line-height: 1; margin-bottom: 8px;">🦷</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">SmileCare</h1>
                    <p style="margin: 4px 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px;">Dental Clinic & Care</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 36px 32px;">
                    <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 20px; font-weight: 700;">
                      Verify Your Email Address
                    </h2>
                    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
                      Hello <strong>${firstName}</strong>, thank you for joining SmileCare! To complete your account registration, please enter this 6-digit verification code:
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #f0f7ff; border: 2px dashed #1e6fe8; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 28px 0;">
                      <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #1e6fe8; font-family: monospace; display: inline-block;">
                        ${otp}
                      </span>
                    </div>

                    <p style="margin: 0 0 12px; font-size: 13.5px; color: #64748b; line-height: 1.5;">
                      ⏰ This code will expire in <strong>${expiresInMinutes} minutes</strong>.
                    </p>
                    <p style="margin: 0; font-size: 13.5px; color: #64748b; line-height: 1.5;">
                      🛡️ For your security, never share this code with anyone. SmileCare staff will never ask for your verification code.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                      If you did not request this registration, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // 1. Try Google Apps Script Webhook (Free, uses your personal Gmail, sends to ANY recipient without a domain!)
  if (process.env.GMAIL_WEBHOOK_URL) {
    try {
      return await sendViaGoogleAppsScript({
        to,
        firstName,
        otp,
        expiresInMinutes,
        subject,
        html,
      });
    } catch (err) {
      console.error(`[EmailService] Google Apps Script dispatch failed: ${err.message}. Trying fallbacks...`);
      throw new Error(`Failed to deliver verification email via Gmail: ${err.message}`);
    }
  }

  // 2. Try Brevo REST API (HTTPS port 443) - sends to ANY recipient email without requiring a custom domain!
  if (process.env.BREVO_API_KEY) {
    try {
      return await sendViaBrevo({
        to,
        firstName,
        otp,
        expiresInMinutes,
        subject,
        html,
      });
    } catch (err) {
      console.error(`[EmailService] Brevo API dispatch failed: ${err.message}. Trying fallbacks...`);
      throw new Error(`Failed to deliver verification email via Brevo: ${err.message}`);
    }
  }

  // 2. Try Resend API (HTTPS port 443) if RESEND_API_KEY is configured
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendViaResend({
        to,
        firstName,
        otp,
        expiresInMinutes,
        fromAddress,
        subject,
        html,
      });
    } catch (err) {
      console.error(`[EmailService] Resend API dispatch failed: ${err.message}. Trying SMTP fallback...`);
      throw new Error(`Failed to deliver verification email via Resend: ${err.message}`);
    }
  }

  // 2. Try SMTP transporter (Gmail / Custom SMTP)
  const transport = getTransporter();

  if (transport) {
    try {
      const info = await transport.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        text: `Hello ${firstName},\n\nYour SmileCare verification code is: ${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nThank you,\nSmileCare Dental Clinic`,
      });
      console.log(`[EmailService] OTP email successfully sent to ${to} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Failed to send email via SMTP to ${to}:`, err.message);
      throw new Error(`Failed to deliver verification email: ${err.message}`);
    }
  }

  console.error(
    `[EmailService] ERROR: No email credentials found (RESEND_API_KEY or EMAIL_USER/EMAIL_PASS). Cannot deliver email to ${to}.`
  );
  throw new Error(
    'Email delivery failed: Email credentials are not configured on the server. Please set RESEND_API_KEY or EMAIL_USER and EMAIL_PASS.'
  );
}

module.exports = { sendOtpEmail };

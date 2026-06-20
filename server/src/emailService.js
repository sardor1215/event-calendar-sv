import nodemailer from "nodemailer";

// Minimal SMTP configuration via environment variables
const SMTP_HOST = process.env.SMTP_HOST || "smtp.yandex.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || "ticket@sunvalleycyprus.com";
const SMTP_PASS = process.env.SMTP_PASS || "yoazetcijinrcyph";
const SMTP_FROM = process.env.SMTP_FROM || `Sun Valley Event Hub <${SMTP_USER}>`;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export const sendEmail = async (to, subject, text, html) => {
  const mailOptions = { from: SMTP_FROM, to, subject, text, html };
  const info = await transporter.sendMail(mailOptions);
  // Return delivery info so callers can detect rejected recipients
  return {
    messageId: info?.messageId,
    accepted: info?.accepted || [],
    rejected: info?.rejected || [],
    response: info?.response,
  };
};

// Function to prepare and send a ticket email
export const sendTicketEmail = async (recipientEmail, ticketName) => {
  const subject = `New Ticket Added: ${ticketName}`;
  const text = `A new ticket named "${ticketName}" has been added.`;
  const html = `<p>A new ticket named "<strong>${ticketName}</strong>" has been added.</p>`;
  await sendEmail(recipientEmail, subject, text, html);
};

// Test email function
export const sendTestEmail = async (recipientEmail) => {
  const subject = "Test Email from SVRR | Tickets";
  const text = "This is a test email to verify the email service is working correctly.";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">🧪 Test Email</h2>
      <p>This is a test email from the <strong>SVRR | Tickets</strong> system.</p>
      <p>If you received this email, it means:</p>
      <ul>
        <li>✅ Email service is configured correctly</li>
        <li>✅ SMTP connection to Yandex is working</li>
        <li>✅ Notifications will be sent properly</li>
      </ul>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        Sent at: ${new Date().toLocaleString()}
      </p>
    </div>
  `;

  try {
    await sendEmail(recipientEmail, subject, text, html);
    return { success: true, message: "Test email sent successfully!" };
  } catch (error) {
    console.error("Error sending test email:", error);
    return { success: false, message: `Failed to send test email: ${error.message}` };
  }
};

import nodemailer from "nodemailer";

/**
 * Environment variables:
 * - MAIL_HOST (default: localhost)
 * - MAIL_PORT (default: 1025)
 * - MAIL_SECURE (boolean-like, default: false)
 * - MAIL_USER (optional)
 * - MAIL_PASS (optional)
 * - MAIL_FROM (optional; fallback to no-reply@${APP_DOMAIN||'localhost'})
 */

const MAIL_HOST = process.env.MAIL_HOST || "localhost";
const MAIL_PORT = Number(process.env.MAIL_PORT || 1025);
const MAIL_SECURE = (process.env.MAIL_SECURE || "false").toLowerCase() === "true";
const MAIL_USER = process.env.MAIL_USER || null;
const MAIL_PASS = process.env.MAIL_PASS || null;
const MAIL_FROM = process.env.MAIL_FROM || `no-reply@${process.env.APP_DOMAIN || "localhost"}`;

let transporter = null;
try {
  transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE,
    auth: MAIL_USER && MAIL_PASS ? { user: MAIL_USER, pass: MAIL_PASS } : undefined,
  });
} catch (err) {
  console.error("tools/mail: failed to create transporter:", err?.message ?? err);
  transporter = null;
}

const verifyTransporter = async () => {
  if (!transporter) return { ok: false, error: "transporter not configured" };
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    console.warn("tools/mail: transporter verification failed:", err?.message ?? err);
    return { ok: false, error: err?.message ?? String(err) };
  }
};

const MailService = {
  transporter,
  verifyTransporter,

  sendEmail: async (to, subject, text, html = null) => {
    if (!to) return { success: false, error: "missing recipient (to)" };
    if (!subject) return { success: false, error: "missing subject" };
    if (!text && !html) return { success: false, error: "missing message body (text or html)" };
    if (!transporter) return { success: false, error: "mail transporter not configured" };

    const mailOptions = {
      from: MAIL_FROM,
      to,
      subject,
      text,
      html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      // Log only non-sensitive information
      console.log("tools/mail: email queued, envelope:", info?.envelope ?? null);
      return { success: true, info };
    } catch (err) {
      console.error("tools/mail.sendEmail error:", err?.message ?? err);
      return { success: false, error: err?.message ?? String(err) };
    }
  },
};

export default MailService;

import nodemailer from "nodemailer";
import fs from "fs-extra";

// Defaults target a local dev SMTP catcher (e.g. MailHog). Set MAIL_HOST /
// MAIL_PORT / MAIL_SECURE / MAIL_USERNAME / MAIL_PASSWORD to point at a real
// relay in production - without them this transport only works against an
// unauthenticated local relay and will fail (safely, see below) elsewhere.
const MAIL_HOST = process.env.MAIL_HOST || "localhost";
const MAIL_PORT = Number(process.env.MAIL_PORT) || 1025;
const MAIL_SECURE = process.env.MAIL_SECURE === "true";
const MAIL_TIMEOUT_MS = Number(process.env.MAIL_TIMEOUT_MS) || 10000;

const auth =
    process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD
        ? { user: process.env.MAIL_USERNAME, pass: process.env.MAIL_PASSWORD }
        : undefined;

const MailService = {
    transporter: nodemailer.createTransport({
        host: MAIL_HOST,
        port: MAIL_PORT,
        secure: MAIL_SECURE,
        auth,
        connectionTimeout: MAIL_TIMEOUT_MS,
        greetingTimeout: MAIL_TIMEOUT_MS,
        socketTimeout: MAIL_TIMEOUT_MS,
    }),
    sendEmail: async (to, subject, text = "", html = null) => {
        if (!to || typeof to !== "string") {
            console.error("sendEmail: refusing to send, missing/invalid recipient");
            return { success: false, message: "Missing recipient" };
        }
        try {
            const mailOptions = {
                from: process.env.MAIL_USERNAME,
                to,
                subject,
                text: "",
                html,
            };
            const info = await MailService.transporter.sendMail(mailOptions);
            console.log("Email sent:", info.response);
            return { success: true, message: "Email sent successfully" };
        } catch (error) {
            console.error("Error sending email:", error?.message ?? error);
            return { success: false, message: "Email sending failed" };
        }
    },
    prepareTemplate: (path, title, id) => {
        let html = fs.readFileSync(path).toString();
        return html.replaceAll("{task}", title).replaceAll("{link}", process.env.APP_LINK).replaceAll("{id}", id);
    }
}

export default MailService;

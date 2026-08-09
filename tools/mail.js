import nodemailer from "nodemailer";
import Mail from "./mail";

const MailService = {
    transporter: nodemailer.createTransport({
        service: process.env.MAIL_SERVICE,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASS,
        }
    }),
    sendEmail: async (to, subject, text, html = null) => {
        try {
            const mailOptions = {
                from: process.env.MAIL_USERNAME,
                to,
                subject,
                text,
                html,
            };
            const info = await MailService.transporter.sendMail(mailOptions);
            console.log("Email sent:", info.response);
            return { success: true, message: "Email sent successfully" };
        } catch (error) {
            console.error("Error sending email:", error);
            return { success: false, message: "Email sending failed" };
        }
    }
}

export default MailService;
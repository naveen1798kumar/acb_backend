import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"ACB Bakery" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📩 Email sent successfully to ${to}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw new Error("Email could not be sent");
  }
};

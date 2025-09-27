import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "smtp"; // smtp | gmail | sendgrid (smtp)

export interface EmailConfigOptions {
  from?: string;
  transporter: Transporter;
}

function createSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const secure = process.env.SMTP_SECURE === "true"; // true for 465, false for other ports

  const authUser = process.env.SMTP_USER;
  const authPass = process.env.SMTP_PASS;
  console.log("Email Configuration:", authPass);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: authUser && authPass ? { user: authUser, pass: authPass } : undefined,
  });

  return transporter;
}

function createTransporter(): Transporter {
  // For now support SMTP; other providers can be mapped here
  if (
    EMAIL_PROVIDER === "smtp" ||
    EMAIL_PROVIDER === "sendgrid" ||
    EMAIL_PROVIDER === "gmail"
  ) {
    return createSmtpTransport();
  }

  // fallback: direct transport (not recommended for prod)
  return nodemailer.createTransport({ streamTransport: true });
}

const transporter = createTransporter();

export const emailConfig: EmailConfigOptions = {
  from:
    process.env.EMAIL_FROM ||
    `no-reply@${process.env.APP_DOMAIN || "localhost"}`,
  transporter,
};

export default emailConfig;

import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { config } from "../config/env";

// -------------------------------
//  TRANSPORTER
// -------------------------------
const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: Number(config.SMTP_PORT),
  secure: config.SMTP_SECURE === "true", // secure=false for 587, true for 465
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
} as SMTPTransport.Options);

// -------------------------------
//  SINGLE EMAIL FUNCTION
// -------------------------------
export const sendEmail = async (
  to: string,
  subject: string,
  text?: string,
  html?: string
) => {
  const mailOptions = {
    from: config.SMTP_USER, // MUST MATCH SMTP USER
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent → ${to}`);
    
    return info;
  } catch (error) {
    console.error(`❌ Email failed → ${to}`, error);
    throw error;
  }
};

// -------------------------------
//  BULK EMAIL FUNCTION
// -------------------------------
interface BulkMailOptions {
  subject: string;
  text?: string;
  html?: string;
  emails: string[];
  concurrency?: number; // how many emails to send parallel (default: 5)
}

export const sendBulkEmails = async ({
  subject,
  text,
  html,
  emails,
  concurrency = 5,
}: BulkMailOptions) => {
  const results: Array<{ email: string; status: string }> = [];

  // Splitting into concurrency batches
  const chunks = (arr: any[], size: number) =>
    arr.reduce(
      (acc, _, i) =>
        i % size ? acc : [...acc, arr.slice(i, i + size)],
      []
    );

  const batches = chunks(emails, concurrency);

  for (const batch of batches) {
    const promises = batch.map(async (email:any) => {
      try {
        await sendEmail(email, subject, text, html);
        results.push({ email, status: "sent" });
      } catch (e) {
        results.push({ email, status: "failed" });
      }
    });

    await Promise.all(promises);
  }

  console.log(`Bulk job finished. Success: ${results.filter(r => r.status === "sent").length} / ${emails.length}`);
  return results;
};

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface EmailService {
  sendMail(options: SendEmailOptions): Promise<any>;
}

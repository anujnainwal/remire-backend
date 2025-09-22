import { EmailService, SendEmailOptions } from "./index";
import emailConfig from "../../../config/sendEmailConfiguration";

export class NodemailerEmailService implements EmailService {
  async sendMail(options: SendEmailOptions) {
    const mail = {
      from: options.from || emailConfig.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const result = await emailConfig.transporter.sendMail(mail);
    return result;
  }
}

export default new NodemailerEmailService();

export type TemplateResult = {
  subject: string;
  html: string;
  text: string;
};

export function welcomeTemplate(opts: {
  name?: string;
  appName?: string;
  actionUrl?: string;
}): TemplateResult {
  const name = opts.name || "User";
  const appName = opts.appName || process.env.APP_NAME || "Orbit Hub";
  const actionUrl = opts.actionUrl || process.env.CLIENT_URL || "";

  const subject = `Welcome to ${appName}, ${name}!`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Welcome to ${appName}, ${name} 👋</h2>
      <p>Thanks for joining ${appName}. We're excited to have you on board.</p>
      ${
        actionUrl
          ? `<p><a href="${actionUrl}" style="color:#1a73e8">Open ${appName}</a></p>`
          : ""
      }
      <p>If you didn't sign up, please ignore this email.</p>
      <hr />
      <small>${appName} Team</small>
    </div>
  `;
  const text = `Welcome to ${appName}, ${name}!\n\nThanks for joining ${appName}. ${
    actionUrl ? `Open here: ${actionUrl}` : ""
  }\n\nIf you didn't sign up, please ignore this email.`;
  return { subject, html, text };
}

export function resetPasswordTemplate(opts: {
  name?: string;
  resetUrl: string;
  expiresIn?: string;
  appName?: string;
}): TemplateResult {
  const name = opts.name || "User";
  const appName = opts.appName || process.env.APP_NAME || "Orbit Hub";
  const expiresIn = opts.expiresIn || "1 hour";
  const subject = `Reset your ${appName} password`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h3>Hello ${name},</h3>
      <p>We received a request to reset your password for your ${appName} account.</p>
      <p>Please click the button below to reset your password. This link will expire in ${expiresIn}.</p>
      <p><a href="${opts.resetUrl}" style="display:inline-block;padding:10px 16px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:4px">Reset Password</a></p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
      <hr />
      <small>${appName} Team</small>
    </div>
  `;
  const text = `Hello ${name},\n\nReset your ${appName} password using the following link (expires in ${expiresIn}): ${opts.resetUrl}\n\nIf you did not request this, ignore this message.`;
  return { subject, html, text };
}

export function verificationCodeTemplate(opts: {
  name?: string;
  code: string;
  appName?: string;
  expiresIn?: string;
}): TemplateResult {
  const name = opts.name || "User";
  const appName = opts.appName || process.env.APP_NAME || "Orbit Hub";
  const expiresIn = opts.expiresIn || "10 minutes";
  const subject = `${appName} verification code`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h3>Hi ${name},</h3>
      <p>Your verification code is:</p>
      <p style="font-size:20px;letter-spacing:3px;font-weight:700">${opts.code}</p>
      <p>This code will expire in ${expiresIn}.</p>
      <hr />
      <small>${appName} Team</small>
    </div>
  `;
  const text = `Hi ${name},\n\nYour verification code: ${opts.code}\nExpires in ${expiresIn}.`;
  return { subject, html, text };
}

// Small helper to build a custom template payload
export function buildTemplatePayload(result: TemplateResult) {
  return {
    subject: result.subject,
    html: result.html,
    text: result.text,
  };
}

const VerifyEmailTemplate = (name:string, verifyLink
: string
) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Your Email</title>

    <style>
      body {
        font-family: 'Inter', Arial, sans-serif;
        background: #f5f7ff;
        margin: 0;
        padding: 0;
      }

      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        overflow: hidden;
      }

      .header {
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        padding: 28px 40px;
        text-align: left;
        color: #fff;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 22px;
        font-weight: 600;
      }

      .logo-icon {
        width: 32px;
        height: 32px;
      }

      .content {
        padding: 40px;
        color: #1e293b;
      }

      .title {
        font-size: 26px;
        font-weight: 700;
        margin-bottom: 12px;
        color: #0f172a;
      }

      .text {
        font-size: 16px;
        line-height: 1.6;
        color: #475569;
        margin-bottom: 28px;
      }

      .button {
        display: inline-block;
        padding: 14px 26px;
        background: #3b82f6;
        color: white;
        text-decoration: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
      }

      .button:hover {
        background: #2563eb;
      }

      .footer {
        text-align: center;
        padding: 25px 40px;
        font-size: 13px;
        color: #64748b;
        background: #f8fafc;
      }
    </style>
  </head>

  <body>
    <div class="container">

      <!-- Header -->
      <div class="header">
        <div class="logo">
          <img src="https://i.imgur.com/1Xq9BiR.png" class="logo-icon" alt="logo" />
          Remiwire
        </div>
      </div>

      <!-- Content -->
      <div class="content">
        <div class="title">Verify Your Email</div>

        <p class="text">Hi ${name},</p>

        <p class="text">
          Welcome to Remiwire! Click the button below to verify your email address 
          and activate your account.
        </p>

        <a href="${verifyLink}" class="button" target="_blank">
          Verify Email
        </a>

        <p class="text" style="margin-top: 24px;">
          If you didn’t create an account, you can safely ignore this email.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        © ${new Date().getFullYear()} Remiwire. All rights reserved.
      </div>

    </div>
  </body>
  </html>
  `;
};

export default VerifyEmailTemplate
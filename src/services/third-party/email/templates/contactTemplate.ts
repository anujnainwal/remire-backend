export interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
  priority: "low" | "medium" | "high";
}

export const generateContactEmailHTML = (data: ContactEmailData): string => {
  const priorityColor = {
    low: "#10B981", // green
    medium: "#F59E0B", // yellow
    high: "#EF4444", // red
  };

  const priorityText = {
    low: "Low Priority",
    medium: "Medium Priority", 
    high: "High Priority",
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Message - Remiwire</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }
            .container {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 30px;
            }
            .priority-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 20px;
            }
            .field {
                margin-bottom: 20px;
            }
            .field-label {
                font-weight: 600;
                color: #4a5568;
                margin-bottom: 5px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .field-value {
                background: #f7fafc;
                padding: 12px;
                border-radius: 6px;
                border-left: 4px solid #667eea;
                font-size: 14px;
                word-wrap: break-word;
            }
            .message-content {
                background: #f7fafc;
                padding: 20px;
                border-radius: 6px;
                border-left: 4px solid #667eea;
                white-space: pre-wrap;
                font-size: 14px;
                line-height: 1.6;
            }
            .footer {
                background: #f8fafc;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
                font-size: 12px;
                color: #718096;
            }
            .timestamp {
                color: #718096;
                font-size: 12px;
                margin-top: 10px;
            }
            .action-buttons {
                margin-top: 20px;
                text-align: center;
            }
            .btn {
                display: inline-block;
                padding: 10px 20px;
                margin: 0 5px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
            }
            .btn:hover {
                background: #5a67d8;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📧 New Contact Message</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Remiwire Contact Form</p>
            </div>
            
            <div class="content">
                <div class="priority-badge" style="background-color: ${priorityColor[data.priority]}; color: white;">
                    ${priorityText[data.priority]}
                </div>
                
                <div class="field">
                    <div class="field-label">From</div>
                    <div class="field-value">${data.name} &lt;${data.email}&gt;</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Subject</div>
                    <div class="field-value">${data.subject}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Message</div>
                    <div class="message-content">${data.message}</div>
                </div>
                
                <div class="timestamp">
                    Received: ${data.timestamp}
                </div>
                
                <div class="action-buttons">
                    <a href="mailto:${data.email}?subject=Re: ${data.subject}" class="btn">
                        Reply via Email
                    </a>
                </div>
            </div>
            
            <div class="footer">
                <p>This message was sent through the Remiwire contact form.</p>
                <p>Please respond to the customer within 24 hours for the best experience.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const generateContactEmailText = (data: ContactEmailData): string => {
  return `
NEW CONTACT MESSAGE - Remiwire
================================

Priority: ${data.priority.toUpperCase()}
From: ${data.name} <${data.email}>
Subject: ${data.subject}
Received: ${data.timestamp}

Message:
--------
${data.message}

---
Reply to: ${data.email}
This message was sent through the Remiwire contact form.
  `;
};

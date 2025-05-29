export const createPasswordResetEmailTemplate = (resetLink: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .email-container {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .button {
          background-color: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          display: inline-block;
          margin: 20px 0;
        }
        .warning {
          color: #666;
          font-size: 12px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password. Click the button below to set a new password:</p>
        
        <a href="${resetLink}" class="button">Reset Password</a>
        
        <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
        
        <p class="warning">This link will expire in 1 hour for security reasons.</p>
        
        <p>Best regards,<br>The Team</p>
      </div>
    </body>
    </html>
  `;
};
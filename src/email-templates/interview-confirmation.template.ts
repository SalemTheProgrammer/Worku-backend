export const generateInterviewConfirmationEmail = (params: {
  candidateName: string;
  companyName: string;
  jobTitle: string;
  date: string;
  time: string;
  type: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  confirmationLink: string;
}) => {
  const {
    candidateName,
    companyName,
    jobTitle,
    date,
    time,
    type,
    location,
    meetingLink,
    notes,
    confirmationLink
  } = params;

  const locationOrLink = type === 'InPerson' ? location : meetingLink;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 5px;
          }
          .content {
            padding: 20px;
            line-height: 1.6;
          }
          .details {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6c757d;
            font-size: 0.9em;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Interview Invitation</h2>
          </div>
          
          <div class="content">
            <p>Hello ${candidateName},</p>
            
            <p>We are pleased to invite you for an interview with ${companyName} for the position of ${jobTitle}.</p>
            
            <div class="details">
              <p><strong>Interview Details:</strong></p>
              <p>📅 Date: ${date}</p>
              <p>🕒 Time: ${time}</p>
              <p>📍 Type: ${type}</p>
              ${locationOrLink ? `<p>🔗 ${type === 'InPerson' ? 'Location' : 'Meeting Link'}: ${locationOrLink}</p>` : ''}
              ${notes ? `<p>📝 Additional Notes: ${notes}</p>` : ''}
            </div>

            <p>Please confirm your attendance by clicking the button below:</p>
            
            <a href="${confirmationLink}" class="button">Confirm Interview</a>
            
            <p>If you need to reschedule or have any questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>${companyName}</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
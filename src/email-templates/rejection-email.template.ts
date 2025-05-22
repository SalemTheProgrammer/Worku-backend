/**
 * Template for generating rejection emails
 */
export function generateRejectionEmailTemplate(data: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  rejectionMessage: string;
}): string {
  const { candidateName, jobTitle, companyName, rejectionMessage } = data;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réponse concernant votre candidature</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Poppins', Arial, sans-serif;
      line-height: 1.6;
      color: #4A4A4A;
      max-width: 650px;
      margin: 0 auto;
      background-color: #F8F9FA;
    }
    
    .email-container {
      background-color: #FFFFFF;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      margin: 20px;
      border-top: 5px solid #3949AB;
    }
    
    .header {
      text-align: center;
      padding: 30px 20px 20px;
      background-color: #FFFFFF;
      border-bottom: 1px solid #EEEEEE;
    }
    
    .logo {
      width: 160px;
      margin-bottom: 15px;
    }
    
    .header h1 {
      color: #3949AB;
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .header p {
      color: #757575;
      font-size: 14px;
    }
    
    .content {
      background-color: #FFFFFF;
      padding: 30px 35px;
    }
    
    .job-details {
      background-color: #F5F7FF;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
      border-left: 4px solid #3949AB;
    }
    
    .job-details h3 {
      color: #3949AB;
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 10px;
    }
    
    .job-details p {
      color: #616161;
      font-size: 14px;
      margin-bottom: 0;
    }
    
    .message {
      color: #4A4A4A;
      font-size: 15px;
      line-height: 1.7;
      margin-bottom: 30px;
    }
    
    .message p {
      margin-bottom: 15px;
    }
    
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    
    .cta-button {
      display: inline-block;
      background-color: #3949AB;
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 50px;
      font-weight: 500;
      font-size: 15px;
      transition: background-color 0.3s;
      margin-top: 10px;
    }
    
    .cta-button:hover {
      background-color: #303F9F;
    }
    
    .footer {
      font-size: 13px;
      text-align: center;
      color: #757575;
      padding: 20px;
      background-color: #F8F9FA;
      border-top: 1px solid #EEEEEE;
    }
    
    .social-links {
      margin: 15px 0;
    }
    
    .social-link {
      display: inline-block;
      margin: 0 10px;
    }
    
    .social-icon {
      width: 24px;
      height: 24px;
    }
    
    .divider {
      border-top: 1px solid #EEEEEE;
      margin: 20px 0;
    }
    
    @media only screen and (max-width: 480px) {
      .content {
        padding: 25px 20px;
      }
      
      .header h1 {
        font-size: 20px;
      }
      
      .job-details {
        padding: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://worku-assets.s3.eu-west-3.amazonaws.com/logo-blue.png" alt="Worku" class="logo">
      <h1>Réponse concernant votre candidature</h1>
      <p>Merci de votre intérêt pour travailler avec nous</p>
    </div>
    
    <div class="content">
      <div class="job-details">
        <h3>Détails du poste</h3>
        <p><strong>Poste :</strong> ${jobTitle}</p>
        <p><strong>Entreprise :</strong> ${companyName}</p>
      </div>
      
      <div class="message">
        <p>Bonjour ${candidateName},</p>
        
        ${rejectionMessage.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
        
        <p>Cordialement,<br>
        L'équipe de recrutement<br>
        ${companyName}</p>
      </div>
      
      <div class="cta-container">
        <p>Continuez votre recherche d'emploi sur Worku</p>
        <a href="https://worku.com/jobs" class="cta-button">Voir les opportunités</a>
      </div>
    </div>
    
    <div class="footer">
      <div class="social-links">
        <a href="https://linkedin.com/company/worku" class="social-link">
          <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" class="social-icon">
        </a>
        <a href="https://twitter.com/worku" class="social-link">
          <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" class="social-icon">
        </a>
        <a href="https://facebook.com/worku" class="social-link">
          <img src="https://cdn-icons-png.flaticon.com/512/174/174848.png" alt="Facebook" class="social-icon">
        </a>
      </div>
      
      <div class="divider"></div>
      
      <p>© ${new Date().getFullYear()} Worku. Tous droits réservés.</p>
      <p>Cet email a été envoyé via la plateforme Worku.</p>
      <p><small>Si vous ne souhaitez plus recevoir nos emails, <a href="https://worku.com/unsubscribe">cliquez ici</a>.</small></p>
    </div>
  </div>
</body>
</html>
  `;
}
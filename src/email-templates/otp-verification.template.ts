export const generateOtpEmailTemplate = (otp: string, expiresInMinutes: number): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vérification de votre compte Worku</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .code { font-size: 32px; font-weight: bold; text-align: center; color: #2563eb; margin: 20px 0; letter-spacing: 3px; }
    .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bienvenue sur Worku!</h1>
    </div>
    
    <p>Bonjour,</p>
    
    <p>Merci de votre inscription sur Worku. Pour vérifier votre compte, veuillez utiliser le code suivant :</p>
    
    <div class="code">${otp}</div>
    
    <p>Ce code expirera dans ${expiresInMinutes} minutes.</p>
    
    <p>Si vous n'avez pas demandé ce code, veuillez ignorer cet email.</p>
    
    <div class="footer">
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
      <p>&copy; ${new Date().getFullYear()} Worku. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
`;

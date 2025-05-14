/**
 * Generates HTML email template for application confirmation
 * @param {string} jobTitle - Position title candidate applied for
 * @param {string} companyName - Hiring company's name
 * @returns {string} Complete HTML email template with styling and dynamic content
 */
export function generateApplicationConfirmationTemplate({
  jobTitle,  // Injected position title from application
  companyName // Company name from job listing
}: {
  jobTitle: string;
  companyName: string;
}): string {
  // Core template structure with dynamic values injected
  return `
    <!-- Main email container -->
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .confirmation-icon {
          text-align: center;
          margin: 20px 0;
          font-size: 48px;
        }
        .details-section {
          margin: 20px 0;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .detail-item {
          margin: 10px 0;
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .detail-item:last-child {
          border-bottom: none;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #6c757d;
          font-size: 14px;
        }
        .highlight {
          color: #007bff;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <!-- Email header with title -->
          <h1 style="color: #2c3e50; margin: 0;">Confirmation de Candidature</h1>
        </div>
        
        <div class="content">
          <div class="confirmation-icon">
            ✓
          </div>

          <p style="font-size: 16px;">
            Bonjour,
          </p>
          
          <!-- Main confirmation message -->
          <p>
            Nous vous remercions d'avoir postulé pour le poste de <span class="highlight">${jobTitle}</span>.
            Votre candidature a été reçue avec succès et est en cours d'examen.
          </p>

          <div class="details-section">
            <h3 style="color: #2c3e50; margin-top: 0;">Détails de la candidature :</h3>
            <div class="detail-item">
              <strong>Poste:</strong> ${jobTitle}
            </div>
            <div class="detail-item">
              <strong>Entreprise:</strong> ${companyName}
            </div>
            <div class="detail-item">
              <strong>Date de candidature:</strong> ${new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>

          <p>
            Notre équipe examine attentivement chaque candidature. Nous vous contacterons dans les plus brefs délais 
            concernant les prochaines étapes du processus de recrutement.
          </p>

          <p style="margin-top: 30px;">
            En attendant, n'hésitez pas à :
          </p>
          <ul>
            <li>Compléter votre profil si nécessaire</li>
            <li>Consulter nos autres offres d'emploi</li>
            <li>Suivre notre page entreprise pour les actualités</li>
          </ul>

          <!-- Standard email footer -->
          <div class="footer">
            <p>Cordialement,<br>L'équipe de recrutement</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
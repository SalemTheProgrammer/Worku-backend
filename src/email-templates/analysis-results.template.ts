/**
 * Generates HTML email template for application analysis results
 * @param {string} jobTitle - Position title analyzed
 * @param {string} companyName - Hiring company's name
 * @param {number} score - Compatibility score (0-100)
 * @param {string[]} pointsForts - List of candidate strengths
 * @param {string[]} pointsAmélioration - List of improvement areas
 * @returns {string} Detailed analysis report template with interactive elements
 */
export function generateAnalysisResultsTemplate({
  jobTitle,      // Target position name
  companyName,   // Hiring organization
  score,         // Calculated compatibility score
  pointsForts,   // Strengths from AI analysis
  pointsAmélioration, // Areas needing improvement
}: {
  jobTitle: string;
  companyName: string;
  score: number;
  pointsForts: string[];
  pointsAmélioration: string[];
}): string {
  // Dynamic color scheme based on score threshold
  const scoreColor = score >= 70 ? '#28a745' : '#dc3545'; // Text/border colors
  const scoreBackground = score >= 70 ? '#e8f5e9' : '#ffebee'; // Background colors
  
  // Core template with responsive layout
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
          padding: 20px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .score-section {
          text-align: center;
          margin: 20px 0;
          padding: 20px;
          background-color: ${scoreBackground};
          border-radius: 8px;
        }
        .score-circle {
          width: 120px;
          height: 120px;
          line-height: 120px;
          border-radius: 50%;
          background-color: ${scoreColor};
          color: white;
          font-size: 32px;
          font-weight: bold;
          margin: 0 auto;
          text-align: center;
        }
        .section {
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .section-title {
          color: #2c3e50;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .list-item {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .list-item:last-child {
          border-bottom: none;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #6c757d;
          font-size: 14px;
        }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 15px;
        }
        .points-section {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }
        .points-column {
          flex: 1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <!-- Results header section -->
          <h1 style="color: #2c3e50; margin: 0;">Résultats d'Analyse de Candidature</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 16px;">
            Bonjour,
          </p>
          
          <p>
            Nous avons analysé votre candidature pour le poste de <strong>${jobTitle}</strong> 
            chez <strong>${companyName}</strong>. Voici les résultats détaillés de notre analyse.
          </p>

          <!-- Dynamic score display section -->
          <div class="score-section" role="status" aria-live="polite">
            <div class="score-circle">
              ${score}%
            </div>
            <h2 style="margin: 15px 0 0 0; color: ${scoreColor};">
              ${score >= 70 ? 'Score Excellent!' : 'Score à Améliorer'}
            </h2>
          </div>

          <!-- Strengths/improvements columns -->
          <div class="points-section" aria-describedby="analysisColumns">
            <div class="points-column">
              <div class="section">
                <div class="section-title">✨ Points Forts</div>
                ${pointsForts.map(point => `
                  <div class="list-item">
                    <span style="color: #28a745;">✓</span> ${point}
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="points-column">
              <div class="section">
                <div class="section-title">🎯 Axes d'Amélioration</div>
                ${pointsAmélioration.map(point => `
                  <div class="list-item">
                    <span style="color: #dc3545;">●</span> ${point}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

         <!-- Conditional recommendations section -->
         ${score < 70 ? `
            <div class="section">
              <div class="section-title">💡 Recommandations</div>
              <div class="list-item">
                • Concentrez-vous sur le développement des compétences mentionnées dans les axes d'amélioration
              </div>
              <div class="list-item">
                • Envisagez des formations complémentaires dans ces domaines
              </div>
              <div class="list-item">
                • Mettez en avant vos points forts dans vos futures candidatures
              </div>
            </div>
          ` : ''}

          <div class="section" style="text-align: center;">
            <p style="margin: 0;">
              ${score >= 70 
                ? 'Félicitations pour votre excellent profil ! Nous vous recontacterons prochainement pour la suite du processus.' 
                : 'Continuez à développer vos compétences. N\'hésitez pas à postuler à nouveau lorsque vous aurez renforcé votre profil.'}
            </p>
          </div>

          <!-- Standard email footer -->
          <div class="footer" role="contentinfo">
            <p>Cordialement,<br>L'équipe de recrutement</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Note: Template uses responsive design principles and color-coding
// that meets WCAG contrast ratios for accessibility
import { Alert, CompetenceType, SeverityType } from '../interfaces/job-match.interface';

/**
 * Utilities for handling job match evaluation and scoring
 */
export class EvaluationUtils {
  
  /**
   * Get the match level based on the score
   */
  static getNiveauAdequation(score: number): string {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Bon';
    if (score >= 50) return 'Moyen';
    return 'Faible';
  }

  /**
   * Get the match level for a specific type based on alerts
   */
  static getNiveauForType(type: string, alerts: Alert[]): string {
    const alert = alerts.find(a => a.type === type);
    if (!alert) return 'Non évalué';
    
    switch (alert.severite) {
      case 'faible': return 'Excellent';
      case 'moyenne': return 'Bon';
      case 'élevée': return 'À améliorer';
      default: return 'Non évalué';
    }
  }

  /**
   * Get details for a specific competence type from alerts
   */
  static getDetailsForType(type: string, alerts: Alert[]): string[] {
    const alert = alerts.find(a => a.type === type);
    if (!alert) return [];
    return [alert.probleme];
  }

  /**
   * Get decision recommendation based on score
   */
  static getDecision(score: number): string {
    if (score >= 85) return 'Recommandé fortement';
    if (score >= 70) return 'Recommandé';
    if (score >= 50) return 'À considérer';
    return 'Non recommandé';
  }

  /**
   * Get suggested action based on alerts
   */
  static getActionSuggérée(alerts: Alert[]): string {
    const highPriorityAlert = alerts.find(a => a.severite === 'élevée');
    if (highPriorityAlert) {
      return 'Action prioritaire: ' + highPriorityAlert.probleme;
    }
    const mediumPriorityAlert = alerts.find(a => a.severite === 'moyenne');
    if (mediumPriorityAlert) {
      return mediumPriorityAlert.probleme;
    }
    return 'Procéder à l\'évaluation standard';
  }

  /**
   * Get feedback for candidate based on alerts
   */
  static getRetourCandidat(alerts: Alert[]): string[] {
    return alerts
      .sort((a, b) => {
        const severityOrder = { 'élevée': 3, 'moyenne': 2, 'faible': 1 };
        return severityOrder[b.severite] - severityOrder[a.severite];
      })
      .map(alert => alert.probleme)
      .filter(Boolean);
  }
}
import { ExperienceResponseDto } from '../dto/candidate-response.dto';

/**
 * Calculate total years of experience from experience entries
 * Handles overlapping periods and current positions
 */
export function calculateTotalExperience(experiences: ExperienceResponseDto[]): number {
  if (!experiences || experiences.length === 0) {
    return 0;
  }

  if (!experiences || experiences.length === 0) {
    return 0;
  }

  const now = new Date();
  let totalMonths = 0;
  const sortedExperiences = [...experiences].sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Handle overlapping periods
  let currentPeriodEnd = new Date(0);
  
  sortedExperiences.forEach(exp => {
    const start = new Date(exp.startDate);
    const end = exp.isCurrent ? now : (exp.endDate ? new Date(exp.endDate) : now);
    
    // If this experience starts after the last period ended
    if (start > currentPeriodEnd) {
      const months = (end.getFullYear() - start.getFullYear()) * 12 +
                    (end.getMonth() - start.getMonth());
      if (months > 0) {
        totalMonths += months;
      }
      currentPeriodEnd = end;
    }
    // If this experience ends after the last period
    else if (end > currentPeriodEnd) {
      const months = (end.getFullYear() - currentPeriodEnd.getFullYear()) * 12 +
                    (end.getMonth() - currentPeriodEnd.getMonth());
      if (months > 0) {
        totalMonths += months;
      }
      currentPeriodEnd = end;
    }
  });

  // Convert total months to years, rounded to 1 decimal place
  return Math.round((totalMonths / 12) * 10) / 10;
}
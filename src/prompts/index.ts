/**
 * Index file for exporting all prompts
 */

// Export PDF analysis prompt
export { PDF_ANALYSIS_PROMPT } from './pdf-analysis.prompt';

// Export CV analysis prompt function
export { createCVAnalysisPrompt } from './cv-analysis.prompt';

// Export CV feedback prompts
export { createCVFeedbackPrompt, PDF_CV_FEEDBACK_PROMPT } from './cv-feedback.prompt';

// Export Profile Data interface
export { ProfileData } from './profile-data.interface';

// Export Profile Suggestions prompt function
export { createProfileSuggestionsPrompt } from './profile-suggestions.prompt';
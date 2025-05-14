export interface ScheduledCandidate {
  interviewId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  status: string;
  scheduledDate?: Date;
  scheduledTime?: string;
}
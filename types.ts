export interface StudyTask {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  completed: boolean;
}

export interface StudyDay {
  dayNumber: number;
  date: string; // ISO String
  theme: string;
  tasks: StudyTask[];
}

export interface StudyPlan {
  id: string;
  subject: string;
  goal: string;
  startDate: string;
  endDate: string;
  dailyMinutes: number;
  createdAt: string;
  days: StudyDay[];
  totalTasks: number;
  completedTasks: number;
}

export interface PlanGenerationParams {
  subject: string;
  goal: string;
  startDate: string;
  endDate: string;
  dailyMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

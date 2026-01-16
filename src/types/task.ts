export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface Template {
  id: string;
  name: string;
  icon: string;
  tasks: string[];
}

export type AIAction = 'improve' | 'shorten' | 'professional' | 'breakdown';

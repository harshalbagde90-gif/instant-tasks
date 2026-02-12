export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  color?: string;
  estimatedTime?: string;
  category?: string;
  tags?: string[];
  notes?: string;
  subtasks?: { id: string; text: string; completed: boolean }[];
  attachments?: { id: string; name: string; url: string }[];
  reminder?: string;
  emailReminderEnabled?: boolean;
  whatsappReminderEnabled?: boolean;
  previousText?: string;
}

export interface Template {
  id: string;
  name: string;
  icon: string;
  tasks: string[];
}

export type AIAction = 'improve' | 'shorten' | 'professional' | 'breakdown';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface TagType {
  id: string;
  name: string;
  color: string;
}

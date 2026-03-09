export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
  tags?: string[];
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  description?: string;
  dueDate?: string;
  deadline?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  color?: string;
  estimatedTime?: string;
  category?: string;
  tags?: string[];
  notes?: string;
  subtasks?: Subtask[];
  attachments?: { id: string; name: string; url: string }[];
  reminder?: string;
  // ── Reminder preferences ─────────────────────────────────────
  emailReminderEnabled?: boolean;
  reminderEmail?: string;        // email address to send reminder to
  whatsappReminderEnabled?: boolean;
  whatsappNumber?: string;       // phone number with country code e.g. +919876543210
  whatsappVerified?: boolean;    // has user confirmed receipt of test message?
  reminderSent?: boolean;        // has the reminder already been dispatched?
  previousText?: string;
}


export interface Template {
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

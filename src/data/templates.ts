import { Template } from '@/types/task';

export const templates: Template[] = [
  {
    id: 'daily-routine',
    name: 'My Daily Routine',
    icon: '🌅',
    tasks: [
      'Wake up and stretch for 5 minutes',
      'Drink a glass of water',
      'Have a healthy breakfast',
      'Review today\'s priorities',
      'Exercise for 30 minutes',
      'Prepare lunch',
      'Work on main tasks',
      'Take a short break every 2 hours',
      'Wind down and relax',
      'Prepare for tomorrow'
    ]
  },
  {
    id: 'student-study',
    name: 'Student Study Plan',
    icon: '📖',
    tasks: [
      'Review class notes from yesterday',
      'Complete homework assignments',
      'Read assigned chapters',
      'Practice problems for 30 minutes',
      'Watch educational videos',
      'Create flashcards for key terms',
      'Study with a group or partner',
      'Take a practice quiz',
      'Organize notes and materials',
      'Plan study sessions for the week'
    ]
  },
  {
    id: 'freelancer-work',
    name: 'Freelancer Work',
    icon: '💼',
    tasks: [
      'Check emails and messages',
      'Update project status with clients',
      'Work on current project deliverables',
      'Send invoices for completed work',
      'Research new client opportunities',
      'Update portfolio with recent work',
      'Schedule client calls',
      'Track billable hours',
      'Review contracts and agreements',
      'Plan next week\'s workload'
    ]
  },
  {
    id: 'office-tasks',
    name: 'Office To-Do List',
    icon: '🏢',
    tasks: [
      'Check and respond to emails',
      'Attend morning standup meeting',
      'Review and prioritize tasks',
      'Complete urgent deadlines',
      'Collaborate with team members',
      'Update project documentation',
      'Attend scheduled meetings',
      'Follow up on pending items',
      'Submit weekly reports',
      'Prepare for tomorrow\'s meetings'
    ]
  },
  {
    id: 'meeting-actions',
    name: 'Meeting Action Items',
    icon: '📋',
    tasks: [
      'Share meeting notes with attendees',
      'Assign action items to team members',
      'Set deadlines for each action item',
      'Schedule follow-up meeting',
      'Update project timeline',
      'Create tasks in project management tool',
      'Send reminder emails before deadline',
      'Collect feedback from stakeholders',
      'Document decisions made',
      'Archive meeting recording'
    ]
  }
];

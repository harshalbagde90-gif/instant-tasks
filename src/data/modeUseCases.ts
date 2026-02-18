export const modeUseCases = {
    basic: {
        title: "Basic Mode",
        subtitle: "Perfect for everyday task management",
        icon: "LayoutGrid",
        color: "#6B7280",
        useCases: [
            {
                emoji: "📝",
                title: "Daily To-Dos",
                description: "Manage your daily tasks and check them off as you complete them"
            },
            {
                emoji: "🛒",
                title: "Shopping Lists",
                description: "Create and organize your grocery and shopping lists"
            },
            {
                emoji: "📌",
                title: "Quick Reminders",
                description: "Set simple reminders for important things to remember"
            },
            {
                emoji: "✅",
                title: "Simple Checklists",
                description: "Track progress on basic tasks with easy checkboxes"
            },
            {
                emoji: "📋",
                title: "Personal Notes",
                description: "Jot down quick thoughts and personal notes"
            },
            {
                emoji: "🎯",
                title: "Goal Tracking",
                description: "Keep track of your personal goals and milestones"
            }
        ]
    },
    advanced: {
        title: "Advanced Mode",
        subtitle: "For power users and professionals",
        icon: "Layers",
        color: "#FACC15",
        useCases: [
            {
                emoji: "📊",
                title: "Project Management",
                description: "Manage complex projects with multiple tasks and dependencies"
            },
            {
                emoji: "📅",
                title: "Time-Based Scheduling",
                description: "Schedule tasks with specific dates, times, and deadlines"
            },
            {
                emoji: "🏷️",
                title: "Categories & Tags",
                description: "Organize tasks with custom categories and tags for better filtering"
            },
            {
                emoji: "⚡",
                title: "Priority Workflow",
                description: "Set priorities and focus on high-impact tasks first"
            },
            {
                emoji: "📎",
                title: "File Attachments",
                description: "Attach documents, images, and files to your tasks"
            },
            {
                emoji: "🔄",
                title: "Subtask Management",
                description: "Break down complex tasks into manageable subtasks"
            },
            {
                emoji: "📆",
                title: "Day-to-Day Planning",
                description: "Plan your week with advanced calendar integration"
            },
            {
                emoji: "📝",
                title: "Detailed Notes",
                description: "Add comprehensive notes and context to each task"
            }
        ]
    },
    "big-data": {
        title: "Big Data Mode",
        subtitle: "For developers and content creators",
        icon: "Database",
        color: "#3B82F6",
        useCases: [
            {
                emoji: "💻",
                title: "Code Snippets Library",
                description: "Store and organize reusable code snippets across multiple languages"
            },
            {
                emoji: "🤖",
                title: "AI Prompts Storage",
                description: "Save and manage your best AI prompts for ChatGPT, Claude, etc."
            },
            {
                emoji: "📜",
                title: "Scripts Management",
                description: "Keep all your bash, python, and automation scripts in one place"
            },
            {
                emoji: "📚",
                title: "Documentation Workspace",
                description: "Write and maintain technical documentation with syntax highlighting"
            },
            {
                emoji: "🎨",
                title: "Multi-Sheet Organization",
                description: "Organize content across multiple sheets by category or project"
            },
            {
                emoji: "✨",
                title: "AI-Powered Optimization",
                description: "Enhance your prompts and scripts with built-in AI assistance"
            },
            {
                emoji: "🔍",
                title: "Large Text Data",
                description: "Handle and search through large amounts of text efficiently"
            },
            {
                emoji: "🎯",
                title: "Template Library",
                description: "Save frequently used templates for quick access"
            }
        ]
    }
} as const;

export type ModeType = keyof typeof modeUseCases;

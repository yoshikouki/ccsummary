export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | any[];
  timestamp: string;
  uuid: string;
  sessionId: string;
  cwd: string;
}

export interface ClaudeSession {
  id: string;
  messages: ClaudeMessage[];
  startTime: string;
  endTime: string;
  cwd: string;
  messageCount: number;
}

export interface ClaudeProject {
  name: string;
  path: string;
  sessions: ClaudeSession[];
  lastActivity: string;
  totalMessages: number;
  totalSessions: number;
}

export interface ClaudeAnalysisResult {
  projects: ClaudeProject[];
  totalSessions: number;
  totalMessages: number;
  analysisPeriod: {
    start: string;
    end: string;
  };
}

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

export interface ReportOptions {
  date: string;
  outputDir: string;
  projectFilter?: string;
}

export interface ProjectSummary {
  name: string;
  path: string;
  sessionsCount: number;
  messagesCount: number;
  lastActivity: string;
  keyActivities: string[];
  completedTodos: TodoItem[];
  pendingTodos: TodoItem[];
}

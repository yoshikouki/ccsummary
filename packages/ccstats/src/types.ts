/**
 * Core types for Claude Code statistics analysis
 */

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | any[];
  timestamp: string;
  uuid: string;
  sessionId: string;
  cwd: string;
  parentUuid?: string;
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

export interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  id: string;
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

export interface AnalysisOptions {
  targetDate?: string;
  projectFilter?: string;
  includeCompletedTodos?: boolean;
}
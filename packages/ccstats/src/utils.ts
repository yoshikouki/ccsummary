import { homedir } from 'os';
import { join } from 'path';
import dayjs from 'dayjs';
import { ClaudeProject, ClaudeSession, TodoItem } from './types.js';

/**
 * Resolve ~ in file paths
 */
export function resolvePath(path: string): string {
  return path.startsWith('~') ? join(homedir(), path.slice(1)) : path;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Format date for filtering
 */
export function formatDate(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/**
 * Get project statistics
 */
export function getProjectStats(project: ClaudeProject) {
  const userMessages = project.sessions.flatMap(s => 
    s.messages.filter(m => m.role === 'user')
  );
  const assistantMessages = project.sessions.flatMap(s => 
    s.messages.filter(m => m.role === 'assistant')
  );

  return {
    totalSessions: project.totalSessions,
    totalMessages: project.totalMessages,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    averageMessagesPerSession: Math.round(project.totalMessages / project.totalSessions),
    lastActivity: formatTimestamp(project.lastActivity),
  };
}

/**
 * Get session duration in minutes
 */
export function getSessionDuration(session: ClaudeSession): number {
  const start = dayjs(session.startTime);
  const end = dayjs(session.endTime);
  return end.diff(start, 'minute');
}

/**
 * Filter TODOs by status
 */
export function filterTodosByStatus(
  todos: TodoItem[],
  status: TodoItem['status']
): TodoItem[] {
  return todos.filter(todo => todo.status === status);
}

/**
 * Get TODO completion rate
 */
export function getTodoCompletionRate(todos: TodoItem[]): number {
  if (todos.length === 0) return 0;
  const completed = todos.filter(todo => todo.status === 'completed').length;
  return Math.round((completed / todos.length) * 100);
}

/**
 * Group TODOs by priority
 */
export function groupTodosByPriority(todos: TodoItem[]): Record<TodoItem['priority'], TodoItem[]> {
  return todos.reduce((acc, todo) => {
    if (!acc[todo.priority]) {
      acc[todo.priority] = [];
    }
    acc[todo.priority].push(todo);
    return acc;
  }, {} as Record<TodoItem['priority'], TodoItem[]>);
}

/**
 * Get most active project
 */
export function getMostActiveProject(projects: ClaudeProject[]): ClaudeProject | null {
  if (projects.length === 0) return null;
  
  return projects.reduce((mostActive, current) => 
    current.totalMessages > mostActive.totalMessages ? current : mostActive
  );
}

/**
 * Get recent activity (last N days)
 */
export function getRecentActivity(
  projects: ClaudeProject[],
  days: number = 7
): ClaudeProject[] {
  const cutoff = dayjs().subtract(days, 'day');
  
  return projects.filter(project => 
    dayjs(project.lastActivity).isAfter(cutoff)
  );
}

/**
 * Extract unique working directories
 */
export function getWorkingDirectories(projects: ClaudeProject[]): string[] {
  const cwds = new Set<string>();
  
  projects.forEach(project => {
    project.sessions.forEach(session => {
      if (session.cwd) {
        cwds.add(session.cwd);
      }
    });
  });
  
  return Array.from(cwds).sort();
}

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  // Basic UUID v4 validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

/**
 * Sanitize content for safe display (remove potentially sensitive info)
 */
export function sanitizeContent(content: string): string {
  // Remove potential environment variables
  return content.replace(/process\.env\.(\w+)/g, 'process.env.***');
}

/**
 * Calculate activity timeline
 */
export function getActivityTimeline(
  projects: ClaudeProject[],
  days: number = 30
): Record<string, number> {
  const timeline: Record<string, number> = {};
  const cutoff = dayjs().subtract(days, 'day');

  projects.forEach(project => {
    project.sessions.forEach(session => {
      session.messages.forEach(message => {
        const date = dayjs(message.timestamp);
        if (date.isAfter(cutoff)) {
          const dateKey = date.format('YYYY-MM-DD');
          timeline[dateKey] = (timeline[dateKey] || 0) + 1;
        }
      });
    });
  });

  return timeline;
}
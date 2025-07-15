/**
 * ccstats - Claude Code Statistics Library
 * 
 * A TypeScript library for analyzing Claude Code usage patterns
 * from ~/.claude directory data.
 */

// Core functions
export {
  analyzeClaudeUsage,
  loadTodos,
  loadAllTodos,
} from './analyzer.js';

// Types
export type {
  ClaudeMessage,
  ClaudeSession,
  ClaudeProject,
  TodoItem,
  ClaudeAnalysisResult,
  AnalysisOptions,
} from './types.js';

// Utilities
export {
  resolvePath,
  formatTimestamp,
  formatDate,
  getProjectStats,
  getSessionDuration,
  filterTodosByStatus,
  getTodoCompletionRate,
  groupTodosByPriority,
  getMostActiveProject,
  getRecentActivity,
  getWorkingDirectories,
  isValidSessionId,
  sanitizeContent,
  getActivityTimeline,
} from './utils.js';
// Re-export types from ccstats for backward compatibility
export type {
  ClaudeMessage,
  ClaudeSession,
  ClaudeProject,
  TodoItem,
  ClaudeAnalysisResult,
  AnalysisOptions,
} from '@yoshikouki/ccstats';

export interface ReportOptions {
  date: string;
  outputDir: string;
  projectFilter?: string;
}

export interface ReportStructure {
  summaryPath: string;
  promptsPath: string;
  todoPath: string;
}

export interface GeneratedReports {
  all: ReportStructure;
  projects: Map<string, ReportStructure>;
}

export interface ProjectSummary {
  name: string;
  path: string;
  sessionsCount: number;
  messagesCount: number;
  lastActivity: string;
  keyActivities: string[];
  completedTodos: any[];
  pendingTodos: any[];
}

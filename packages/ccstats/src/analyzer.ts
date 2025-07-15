import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import { homedir } from 'os';
import dayjs from 'dayjs';
import {
  ClaudeAnalysisResult,
  ClaudeProject,
  ClaudeSession,
  ClaudeMessage,
  TodoItem,
  AnalysisOptions,
} from './types.js';

/**
 * Analyze Claude Code directory and extract usage statistics
 */
export async function analyzeClaudeUsage(
  claudeDir: string,
  options: AnalysisOptions = {}
): Promise<ClaudeAnalysisResult> {
  const resolvedDir = claudeDir.startsWith('~') ? join(homedir(), claudeDir.slice(1)) : claudeDir;
  const { targetDate, projectFilter } = options;

  // Get project directories
  const projectsDir = join(resolvedDir, 'projects');
  const projectDirs = await readdir(projectsDir, { withFileTypes: true });
  const projects: ClaudeProject[] = [];

  for (const projectDir of projectDirs) {
    if (!projectDir.isDirectory()) continue;

    const projectPath = join(projectsDir, projectDir.name);
    const project = await analyzeProject(projectPath, projectDir.name, targetDate);

    if (project) {
      // Apply project filter if specified
      if (projectFilter && !project.name.includes(projectFilter)) {
        continue;
      }
      projects.push(project);
    }
  }

  const totalSessions = projects.reduce((sum, p) => sum + p.totalSessions, 0);
  const totalMessages = projects.reduce((sum, p) => sum + p.totalMessages, 0);

  return {
    projects,
    totalSessions,
    totalMessages,
    analysisPeriod: {
      start: targetDate || dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
      end: targetDate || dayjs().format('YYYY-MM-DD'),
    },
  };
}

/**
 * Analyze a single project directory
 */
async function analyzeProject(
  projectPath: string,
  encodedName: string,
  targetDate?: string
): Promise<ClaudeProject | null> {
  try {
    const files = await readdir(projectPath);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

    if (jsonlFiles.length === 0) return null;

    const sessions: ClaudeSession[] = [];
    const decodedName = decodeProjectName(encodedName);

    for (const jsonlFile of jsonlFiles) {
      const session = await analyzeSession(join(projectPath, jsonlFile), targetDate);
      if (session) {
        sessions.push(session);
      }
    }

    if (sessions.length === 0) return null;

    const lastActivity = sessions
      .map(s => s.endTime)
      .sort()
      .reverse()[0];

    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);

    return {
      name: decodedName,
      path: encodedName,
      sessions,
      lastActivity,
      totalMessages,
      totalSessions: sessions.length,
    };
  } catch (error) {
    console.warn(`Failed to analyze project ${encodedName}:`, error);
    return null;
  }
}

/**
 * Analyze a single session file
 */
async function analyzeSession(
  sessionPath: string,
  targetDate?: string
): Promise<ClaudeSession | null> {
  try {
    const content = await readFile(sessionPath, 'utf-8');
    const lines = content.trim().split('\n');
    const messages: ClaudeMessage[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const data = JSON.parse(line);

        // Apply date filtering early
        if (targetDate && data.timestamp) {
          const messageDate = dayjs(data.timestamp).format('YYYY-MM-DD');
          if (messageDate !== targetDate) continue;
        }

        if (data.message && data.message.role) {
          messages.push({
            role: data.message.role,
            content: data.message.content,
            timestamp: data.timestamp,
            uuid: data.uuid,
            sessionId: data.sessionId,
            cwd: data.cwd,
            parentUuid: data.parentUuid,
          });
        }
      } catch (parseError) {
        // Skip invalid JSON lines
        continue;
      }
    }

    if (messages.length === 0) return null;

    const sessionId = messages[0].sessionId;
    const startTime = messages[0].timestamp;
    const endTime = messages[messages.length - 1].timestamp;
    const cwd = messages[0].cwd;

    return {
      id: sessionId,
      messages,
      startTime,
      endTime,
      cwd,
      messageCount: messages.length,
    };
  } catch (error) {
    console.warn(`Failed to analyze session ${sessionPath}:`, error);
    return null;
  }
}

/**
 * Decode project name from encoded format
 */
function decodeProjectName(encodedName: string): string {
  // Convert encoded name like "-home-user-project" to "/home/user/project"
  const decoded = encodedName.replace(/^-/, '').replace(/-/g, '/');
  return basename(decoded);
}

/**
 * Load TODOs for a specific session
 */
export async function loadTodos(
  todosDir: string,
  sessionId: string,
  options: AnalysisOptions = {}
): Promise<TodoItem[]> {
  const resolvedDir = todosDir.startsWith('~') ? join(homedir(), todosDir.slice(1)) : todosDir;
  const { includeCompletedTodos = true } = options;

  try {
    const todoFiles = await readdir(resolvedDir);
    const relevantFiles = todoFiles.filter(f => f.includes(sessionId));

    const todos: TodoItem[] = [];

    for (const file of relevantFiles) {
      try {
        const content = await readFile(join(resolvedDir, file), 'utf-8');
        const todoData = JSON.parse(content);

        if (Array.isArray(todoData)) {
          const filteredTodos = includeCompletedTodos 
            ? todoData 
            : todoData.filter((todo: TodoItem) => todo.status !== 'completed');
          todos.push(...filteredTodos);
        }
      } catch (error) {
        continue;
      }
    }

    return todos;
  } catch (error) {
    return [];
  }
}

/**
 * Load all TODOs from the todos directory
 */
export async function loadAllTodos(
  claudeDir: string,
  options: AnalysisOptions = {}
): Promise<Map<string, TodoItem[]>> {
  const resolvedDir = claudeDir.startsWith('~') ? join(homedir(), claudeDir.slice(1)) : claudeDir;
  const todosDir = join(resolvedDir, 'todos');
  const { includeCompletedTodos = true } = options;

  const todosBySession = new Map<string, TodoItem[]>();

  try {
    const todoFiles = await readdir(todosDir);

    for (const file of todoFiles) {
      if (!file.endsWith('.json')) continue;

      // Extract session ID from filename pattern: {sessionId}-agent-{agentId}.json
      const sessionMatch = file.match(/^([^-]+)-agent-/);
      if (!sessionMatch) continue;

      const sessionId = sessionMatch[1];

      try {
        const content = await readFile(join(todosDir, file), 'utf-8');
        const todoData = JSON.parse(content);

        if (Array.isArray(todoData)) {
          const filteredTodos = includeCompletedTodos 
            ? todoData 
            : todoData.filter((todo: TodoItem) => todo.status !== 'completed');
          
          const existing = todosBySession.get(sessionId) || [];
          todosBySession.set(sessionId, [...existing, ...filteredTodos]);
        }
      } catch (error) {
        continue;
      }
    }

    return todosBySession;
  } catch (error) {
    return new Map();
  }
}
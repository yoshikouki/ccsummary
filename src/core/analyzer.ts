import { readdir, readFile, stat } from 'fs/promises';
import { join, basename } from 'path';
import { homedir } from 'os';
import dayjs from 'dayjs';
import { ClaudeAnalysisResult, ClaudeProject, ClaudeSession, ClaudeMessage, TodoItem } from '../types';

export async function analyzeClaudeDirectory(claudeDir: string, targetDate?: string): Promise<ClaudeAnalysisResult> {
  const resolvedDir = claudeDir.startsWith('~') ? join(homedir(), claudeDir.slice(1)) : claudeDir;
  
  // プロジェクトディレクトリを取得
  const projectsDir = join(resolvedDir, 'projects');
  const todosDir = join(resolvedDir, 'todos');
  
  const projectDirs = await readdir(projectsDir, { withFileTypes: true });
  const projects: ClaudeProject[] = [];
  
  for (const projectDir of projectDirs) {
    if (!projectDir.isDirectory()) continue;
    
    const projectPath = join(projectsDir, projectDir.name);
    const project = await analyzeProject(projectPath, projectDir.name, todosDir, targetDate);
    
    if (project) {
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
      end: targetDate || dayjs().format('YYYY-MM-DD')
    }
  };
}

async function analyzeProject(projectPath: string, encodedName: string, todosDir: string, targetDate?: string): Promise<ClaudeProject | null> {
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
      totalSessions: sessions.length
    };
  } catch (error) {
    console.warn(`Failed to analyze project ${encodedName}:`, error);
    return null;
  }
}

async function analyzeSession(sessionPath: string, targetDate?: string): Promise<ClaudeSession | null> {
  try {
    const content = await readFile(sessionPath, 'utf-8');
    const lines = content.trim().split('\n');
    const messages: ClaudeMessage[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const data = JSON.parse(line);
        
        // メッセージの日付フィルタリング
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
            cwd: data.cwd
          });
        }
      } catch (parseError) {
        // 無効なJSONをスキップ
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
      messageCount: messages.length
    };
  } catch (error) {
    console.warn(`Failed to analyze session ${sessionPath}:`, error);
    return null;
  }
}

function decodeProjectName(encodedName: string): string {
  // エンコードされたプロジェクト名をデコード
  // 例: -home-yoshikouki-src-github-com-yoshikouki-ccsummary -> /home/yoshikouki/src/github.com/yoshikouki/ccsummary
  const decoded = encodedName.replace(/^-/, '').replace(/-/g, '/');
  return basename(decoded);
}

export async function loadTodos(todosDir: string, sessionId: string): Promise<TodoItem[]> {
  try {
    const todoFiles = await readdir(todosDir);
    const relevantFiles = todoFiles.filter(f => f.includes(sessionId));
    
    const todos: TodoItem[] = [];
    
    for (const file of relevantFiles) {
      try {
        const content = await readFile(join(todosDir, file), 'utf-8');
        const todoData = JSON.parse(content);
        
        if (Array.isArray(todoData)) {
          todos.push(...todoData);
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
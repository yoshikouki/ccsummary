import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import dayjs from 'dayjs';
import {
  ClaudeAnalysisResult,
  ReportOptions,
  ProjectSummary,
  ClaudeProject,
  ClaudeMessage,
  GeneratedReports,
  ReportStructure,
} from '../types';
import { loadTodos } from './analyzer';

export async function generateReport(
  analysisResult: ClaudeAnalysisResult,
  options: ReportOptions
): Promise<GeneratedReports> {
  const resolvedOutputDir = options.outputDir.startsWith('~') 
    ? join(homedir(), options.outputDir.slice(1))
    : options.outputDir;
  
  const dateStr = dayjs(options.date).format('YYYYMMDD');
  const results: GeneratedReports = {
    all: await generateAllProjectsReport(analysisResult, resolvedOutputDir, dateStr, options),
    projects: new Map()
  };
  
  // Generate individual project reports
  for (const project of analysisResult.projects) {
    if (options.projectFilter && !project.name.includes(options.projectFilter)) {
      continue;
    }
    
    const projectReport = await generateProjectReport(project, resolvedOutputDir, dateStr, options.date);
    results.projects.set(project.name, projectReport);
  }
  
  return results;
}

async function generateAllProjectsReport(
  analysisResult: ClaudeAnalysisResult,
  outputDir: string,
  dateStr: string,
  options: ReportOptions
): Promise<ReportStructure> {
  const allDir = join(outputDir, 'all', dateStr);
  await mkdir(allDir, { recursive: true });
  
  const summaryPath = join(allDir, 'summary.md');
  const promptsPath = join(allDir, 'prompts.md');
  const todoPath = join(allDir, 'todo.md');
  
  // Generate summary
  const summaryContent = await generateReportContent(analysisResult, options);
  await writeFile(summaryPath, summaryContent, 'utf-8');
  
  // Generate prompts (user messages)
  const promptsContent = generatePromptsContent(analysisResult, options);
  await writeFile(promptsPath, promptsContent, 'utf-8');
  
  // Generate todos
  const todoContent = await generateTodoContent(analysisResult, options);
  await writeFile(todoPath, todoContent, 'utf-8');
  
  return { summaryPath, promptsPath, todoPath };
}

async function generateProjectReport(
  project: ClaudeProject,
  outputDir: string,
  dateStr: string,
  targetDate: string
): Promise<ReportStructure> {
  const projectDir = join(outputDir, project.path, dateStr);
  await mkdir(projectDir, { recursive: true });
  
  const summaryPath = join(projectDir, 'summary.md');
  const promptsPath = join(projectDir, 'prompts.md');
  const todoPath = join(projectDir, 'todo.md');
  
  // Generate project-specific summary
  const summaryContent = await generateProjectSummaryContent(project, targetDate);
  await writeFile(summaryPath, summaryContent, 'utf-8');
  
  // Generate project-specific prompts
  const promptsContent = generateProjectPromptsContent(project);
  await writeFile(promptsPath, promptsContent, 'utf-8');
  
  // Generate project-specific todos
  const todoContent = await generateProjectTodoContent(project);
  await writeFile(todoPath, todoContent, 'utf-8');
  
  return { summaryPath, promptsPath, todoPath };
}

async function generateReportContent(
  analysisResult: ClaudeAnalysisResult,
  options: ReportOptions
): Promise<string> {
  const date = dayjs(options.date);
  const projects = options.projectFilter
    ? analysisResult.projects.filter(p => p.name.includes(options.projectFilter!))
    : analysisResult.projects;

  const projectSummaries = await Promise.all(
    projects.map(project => generateProjectSummary(project, options.date))
  );

  const totalSessions = projectSummaries.reduce((sum, p) => sum + p.sessionsCount, 0);
  const totalMessages = projectSummaries.reduce((sum, p) => sum + p.messagesCount, 0);

  let content = '';

  // ヘッダー
  content += `# Claude Code 日報 - ${date.format('YYYY年MM月DD日')}\n\n`;

  // 概要
  content += `## 📊 活動概要\n\n`;
  content += `- **対象日**: ${date.format('YYYY年MM月DD日 (dddd)')}\n`;
  content += `- **プロジェクト数**: ${projectSummaries.length}\n`;
  content += `- **セッション数**: ${totalSessions}\n`;
  content += `- **メッセージ数**: ${totalMessages}\n\n`;

  // プロジェクト別詳細
  if (projectSummaries.length > 0) {
    content += `## 🚀 プロジェクト別活動\n\n`;

    for (const [index, summary] of projectSummaries.entries()) {
      content += `### ${index + 1}. ${summary.name}\n\n`;
      content += `**基本情報**\n`;
      content += `- パス: \`${summary.path}\`\n`;
      content += `- セッション数: ${summary.sessionsCount}\n`;
      content += `- メッセージ数: ${summary.messagesCount}\n`;
      content += `- 最終活動: ${dayjs(summary.lastActivity).format('YYYY-MM-DD HH:mm')}\n\n`;

      // 主な活動
      if (summary.keyActivities.length > 0) {
        content += `**主な活動**\n`;
        for (const activity of summary.keyActivities) {
          content += `- ${activity}\n`;
        }
        content += `\n`;
      }

      // 完了したTODO
      if (summary.completedTodos.length > 0) {
        content += `**✅ 完了したタスク**\n`;
        for (const todo of summary.completedTodos) {
          content += `- ${todo.content}\n`;
        }
        content += `\n`;
      }

      // 未完了のTODO
      if (summary.pendingTodos.length > 0) {
        content += `**⏳ 未完了のタスク**\n`;
        for (const todo of summary.pendingTodos) {
          const priority =
            todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
          const status = todo.status === 'in_progress' ? '🔄' : '📋';
          content += `- ${priority} ${status} ${todo.content}\n`;
        }
        content += `\n`;
      }

      content += `---\n\n`;
    }
  }

  // 統計情報
  content += `## 📈 統計情報\n\n`;
  content += generateStats(projectSummaries);

  // フッター
  content += `\n---\n\n`;
  content += `*このレポートは [ccsummary](https://github.com/yoshikouki/ccsummary) によって自動生成されました*\n`;
  content += `*生成日時: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}*\n`;

  return content;
}

async function generateProjectSummary(
  project: ClaudeProject,
  targetDate: string
): Promise<ProjectSummary> {
  const keyActivities: string[] = [];
  const allTodos = new Map<string, any>();

  // セッションから主な活動を抽出
  for (const session of project.sessions) {
    const activities = extractKeyActivities(session.messages);
    keyActivities.push(...activities);

    // TODO情報を収集
    try {
      const todos = await loadTodos(join(process.env.HOME || '', '.claude/todos'), session.id);
      todos.forEach(todo => allTodos.set(todo.id, todo));
    } catch (error) {
      // エラーは無視
    }
  }

  const todos = Array.from(allTodos.values());
  const completedTodos = todos.filter(t => t.status === 'completed');
  const pendingTodos = todos.filter(t => t.status === 'pending' || t.status === 'in_progress');

  return {
    name: project.name,
    path: project.path,
    sessionsCount: project.sessions.length,
    messagesCount: project.totalMessages,
    lastActivity: project.lastActivity,
    keyActivities: keyActivities.slice(0, 5), // 最大5つの活動
    completedTodos,
    pendingTodos,
  };
}

function extractKeyActivities(messages: ClaudeMessage[]): string[] {
  const activities: string[] = [];

  for (const message of messages) {
    if (message.role === 'user') {
      const content = typeof message.content === 'string' ? message.content : '';

      // ユーザーメッセージから主要な活動を抽出
      if (content.length > 10 && content.length < 200) {
        const summary = content.substring(0, 100);
        if (!activities.includes(summary)) {
          activities.push(summary);
        }
      }
    }
  }

  return activities.slice(0, 5); // 最大5つの活動
}

function generateStats(projectSummaries: ProjectSummary[]): string {
  const totalCompleted = projectSummaries.reduce((sum, p) => sum + p.completedTodos.length, 0);
  const totalPending = projectSummaries.reduce((sum, p) => sum + p.pendingTodos.length, 0);

  const mostActiveProject = projectSummaries.reduce(
    (max, p) => (p.messagesCount > max.messagesCount ? p : max),
    projectSummaries[0] || { messagesCount: 0, name: 'なし' }
  );

  let stats = '';
  stats += `**タスク完了率**\n`;
  stats += `- 完了済み: ${totalCompleted}件\n`;
  stats += `- 未完了: ${totalPending}件\n`;
  stats += `- 完了率: ${totalCompleted + totalPending > 0 ? Math.round((totalCompleted / (totalCompleted + totalPending)) * 100) : 0}%\n\n`;

  stats += `**最も活発なプロジェクト**\n`;
  stats += `- ${mostActiveProject.name} (${mostActiveProject.messagesCount} messages)\n\n`;

  return stats;
}

function generatePromptsContent(
  analysisResult: ClaudeAnalysisResult,
  options: ReportOptions
): string {
  const date = dayjs(options.date);
  let content = '';
  
  content += `# Claude Code プロンプト集 - ${date.format('YYYY年MM月DD日')}\n\n`;
  content += `## 📝 概要\n\n`;
  content += `この日にClaude Codeで使用されたユーザープロンプト（質問・指示）の一覧です。\n\n`;
  
  const projects = options.projectFilter 
    ? analysisResult.projects.filter(p => p.name.includes(options.projectFilter!))
    : analysisResult.projects;
  
  for (const [index, project] of projects.entries()) {
    content += `## ${index + 1}. ${project.name}\n\n`;
    
    for (const session of project.sessions) {
      const userMessages = session.messages.filter(m => m.role === 'user');
      if (userMessages.length > 0) {
        content += `### セッション ${session.id.slice(0, 8)}...\n\n`;
        for (const [msgIndex, message] of userMessages.entries()) {
          const content_text = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
          const timestamp = dayjs(message.timestamp).format('HH:mm');
          content += `**${msgIndex + 1}. [${timestamp}]**\n`;
          content += `\`\`\`\n${content_text}\n\`\`\`\n\n`;
        }
      }
    }
    content += `---\n\n`;
  }
  
  content += `*生成日時: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}*\n`;
  return content;
}

async function generateTodoContent(
  analysisResult: ClaudeAnalysisResult,
  options: ReportOptions
): Promise<string> {
  const date = dayjs(options.date);
  let content = '';
  
  content += `# Claude Code TODO一覧 - ${date.format('YYYY年MM月DD日')}\n\n`;
  
  const allTodos = new Map<string, any>();
  const projects = options.projectFilter 
    ? analysisResult.projects.filter(p => p.name.includes(options.projectFilter!))
    : analysisResult.projects;
  
  // Collect all todos
  for (const project of projects) {
    for (const session of project.sessions) {
      try {
        const todos = await loadTodos(join(process.env.HOME || '', '.claude/todos'), session.id);
        todos.forEach(todo => {
          const key = `${project.name}:${todo.id}`;
          allTodos.set(key, { ...todo, projectName: project.name });
        });
      } catch (error) {
        // エラーは無視
      }
    }
  }
  
  const todos = Array.from(allTodos.values());
  const completedTodos = todos.filter(t => t.status === 'completed');
  const inProgressTodos = todos.filter(t => t.status === 'in_progress');
  const pendingTodos = todos.filter(t => t.status === 'pending');
  
  content += `## 📊 サマリー\n\n`;
  content += `- **完了**: ${completedTodos.length}件\n`;
  content += `- **進行中**: ${inProgressTodos.length}件\n`;
  content += `- **未着手**: ${pendingTodos.length}件\n`;
  content += `- **完了率**: ${todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0}%\n\n`;
  
  if (completedTodos.length > 0) {
    content += `## ✅ 完了したタスク\n\n`;
    for (const todo of completedTodos) {
      const priority = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
      content += `- ${priority} **[${todo.projectName}]** ${todo.content}\n`;
    }
    content += `\n`;
  }
  
  if (inProgressTodos.length > 0) {
    content += `## 🔄 進行中のタスク\n\n`;
    for (const todo of inProgressTodos) {
      const priority = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
      content += `- ${priority} **[${todo.projectName}]** ${todo.content}\n`;
    }
    content += `\n`;
  }
  
  if (pendingTodos.length > 0) {
    content += `## 📋 未着手のタスク\n\n`;
    for (const todo of pendingTodos) {
      const priority = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
      content += `- ${priority} **[${todo.projectName}]** ${todo.content}\n`;
    }
    content += `\n`;
  }
  
  content += `*生成日時: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}*\n`;
  return content;
}

async function generateProjectSummaryContent(
  project: ClaudeProject,
  targetDate: string
): Promise<string> {
  const date = dayjs(targetDate);
  const summary = await generateProjectSummary(project, targetDate);
  
  let content = '';
  content += `# ${project.name} - ${date.format('YYYY年MM月DD日')}\n\n`;
  
  content += `## 📊 基本情報\n\n`;
  content += `- **プロジェクト名**: ${summary.name}\n`;
  content += `- **パス**: \`${summary.path}\`\n`;
  content += `- **セッション数**: ${summary.sessionsCount}\n`;
  content += `- **メッセージ数**: ${summary.messagesCount}\n`;
  content += `- **最終活動**: ${dayjs(summary.lastActivity).format('YYYY-MM-DD HH:mm')}\n\n`;
  
  if (summary.keyActivities.length > 0) {
    content += `## 🚀 主な活動\n\n`;
    for (const activity of summary.keyActivities) {
      content += `- ${activity}\n`;
    }
    content += `\n`;
  }
  
  if (summary.completedTodos.length > 0) {
    content += `## ✅ 完了したタスク\n\n`;
    for (const todo of summary.completedTodos) {
      content += `- ${todo.content}\n`;
    }
    content += `\n`;
  }
  
  if (summary.pendingTodos.length > 0) {
    content += `## ⏳ 未完了のタスク\n\n`;
    for (const todo of summary.pendingTodos) {
      const priority = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
      const status = todo.status === 'in_progress' ? '🔄' : '📋';
      content += `- ${priority} ${status} ${todo.content}\n`;
    }
    content += `\n`;
  }
  
  content += `*生成日時: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}*\n`;
  return content;
}

function generateProjectPromptsContent(project: ClaudeProject): string {
  let content = '';
  content += `# ${project.name} - プロンプト集\n\n`;
  
  for (const session of project.sessions) {
    const userMessages = session.messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      content += `## セッション ${session.id.slice(0, 8)}...\n\n`;
      content += `**期間**: ${dayjs(session.startTime).format('YYYY-MM-DD HH:mm')} - ${dayjs(session.endTime).format('HH:mm')}\n\n`;
      
      for (const [index, message] of userMessages.entries()) {
        const content_text = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
        const timestamp = dayjs(message.timestamp).format('HH:mm');
        content += `### ${index + 1}. [${timestamp}]\n\n`;
        content += `\`\`\`\n${content_text}\n\`\`\`\n\n`;
      }
      content += `---\n\n`;
    }
  }
  
  content += `*生成日時: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}*\n`;
  return content;
}

async function generateProjectTodoContent(project: ClaudeProject): Promise<string> {
  let content = '';
  content += `# ${project.name} - TODO一覧\n\n`;
  
  const allTodos = new Map<string, any>();
  
  for (const session of project.sessions) {
    try {
      const todos = await loadTodos(join(process.env.HOME || '', '.claude/todos'), session.id);
      todos.forEach(todo => allTodos.set(todo.id, todo));
    } catch (error) {
      // エラーは無視
    }
  }
  
  const todos = Array.from(allTodos.values());
  const completedTodos = todos.filter(t => t.status === 'completed');
  const inProgressTodos = todos.filter(t => t.status === 'in_progress');
  const pendingTodos = todos.filter(t => t.status === 'pending');
  
  content += `## 📊 サマリー\n\n`;
  content += `- **完了**: ${completedTodos.length}件\n`;
  content += `- **進行中**: ${inProgressTodos.length}件\n`;
  content += `- **未着手**: ${pendingTodos.length}件\n\n`;
  
  if (completedTodos.length > 0) {
    content += `## ✅ 完了\n\n`;
    for (const todo of completedTodos) {
      const priority = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
      content += `- ${priority} ${todo.content}\n`;
    }
    content += `\n`;
  }
  
  if (inProgressTodos.length > 0) {
    content += `## 🔄 進行中\n\n`;
    for (const todo of inProgressTodos) {
      const priority = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
      content += `- ${priority} ${todo.content}\n`;
    }
    content += `\n`;
  }
  
  if (pendingTodos.length > 0) {
    content += `## 📋 未着手\n\n`;
    for (const todo of pendingTodos) {
      const priority = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
      content += `- ${priority} ${todo.content}\n`;
    }
    content += `\n`;
  }
  
  content += `*生成日時: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}*\n`;
  return content;
}

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
} from '../types';
import { loadTodos } from './analyzer';

export async function generateReport(
  analysisResult: ClaudeAnalysisResult,
  options: ReportOptions
): Promise<string> {
  const resolvedOutputDir = options.outputDir.startsWith('~') 
    ? join(homedir(), options.outputDir.slice(1))
    : options.outputDir;
  const reportDir = join(resolvedOutputDir, dayjs(options.date).format('YYYY-MM'));
  await mkdir(reportDir, { recursive: true });

  const reportFileName = `claude-code-summary-${options.date}.md`;
  const reportPath = join(reportDir, reportFileName);

  const reportContent = await generateReportContent(analysisResult, options);
  await writeFile(reportPath, reportContent, 'utf-8');

  return reportPath;
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

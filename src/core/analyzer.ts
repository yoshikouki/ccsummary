import { analyzeClaudeUsage } from '@yoshikouki/ccstats';
import type { ClaudeAnalysisResult } from '@yoshikouki/ccstats';

export async function analyzeClaudeDirectory(
  claudeDir: string,
  targetDate?: string
): Promise<ClaudeAnalysisResult> {
  return await analyzeClaudeUsage(claudeDir, { targetDate });
}

// Re-export loadTodos for backward compatibility
export { loadTodos } from '@yoshikouki/ccstats';

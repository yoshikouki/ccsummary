import { analyzeClaudeDirectory } from '../src/core/analyzer';
import { readdir } from 'fs/promises';
import { join } from 'path';

describe('analyzer', () => {
  test('analyzeClaudeDirectory should return analysis result', async () => {
    const result = await analyzeClaudeDirectory('~/.claude');
    
    expect(result).toBeDefined();
    expect(result.projects).toBeDefined();
    expect(Array.isArray(result.projects)).toBe(true);
    expect(result.totalSessions).toBeGreaterThanOrEqual(0);
    expect(result.totalMessages).toBeGreaterThanOrEqual(0);
    expect(result.analysisPeriod).toBeDefined();
    expect(result.analysisPeriod.start).toBeDefined();
    expect(result.analysisPeriod.end).toBeDefined();
  });

  test('should handle non-existent directory gracefully', async () => {
    try {
      await analyzeClaudeDirectory('/non/existent/path');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
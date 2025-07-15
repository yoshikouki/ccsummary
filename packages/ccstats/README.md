# @yoshikouki/ccstats

Claude Code usage statistics library for analyzing `~/.claude` directory data.

## Features

- 📊 Analyze Claude Code usage patterns
- 🚀 Project-based activity tracking
- ✅ TODO status monitoring
- 📈 Statistical insights
- 🔍 Session and message analysis
- 📅 Date-based filtering
- 🎯 Type-safe TypeScript API

## Installation

```bash
npm install @yoshikouki/ccstats
# or
pnpm add @yoshikouki/ccstats
```

## Usage

### Basic Analysis

```typescript
import { analyzeClaudeUsage } from '@yoshikouki/ccstats';

// Analyze all projects
const result = await analyzeClaudeUsage('~/.claude');

console.log(`Total projects: ${result.projects.length}`);
console.log(`Total sessions: ${result.totalSessions}`);
console.log(`Total messages: ${result.totalMessages}`);

// Analyze specific date
const todayResult = await analyzeClaudeUsage('~/.claude', {
  targetDate: '2025-07-15'
});

// Filter by project
const projectResult = await analyzeClaudeUsage('~/.claude', {
  projectFilter: 'myproject'
});
```

### TODO Analysis

```typescript
import { loadTodos, loadAllTodos } from '@yoshikouki/ccstats';

// Load TODOs for specific session
const todos = await loadTodos('~/.claude/todos', 'session-id');

// Load all TODOs
const allTodos = await loadAllTodos('~/.claude');
```

### Utilities

```typescript
import { 
  getProjectStats, 
  getTodoCompletionRate, 
  getMostActiveProject,
  getActivityTimeline 
} from '@yoshikouki/ccstats';

// Get project statistics
const stats = getProjectStats(project);
console.log(`Average messages per session: ${stats.averageMessagesPerSession}`);

// Calculate TODO completion rate
const completionRate = getTodoCompletionRate(todos);
console.log(`Completion rate: ${completionRate}%`);

// Find most active project
const mostActive = getMostActiveProject(projects);

// Get activity timeline
const timeline = getActivityTimeline(projects, 30); // Last 30 days
```

## API Reference

### Core Functions

#### `analyzeClaudeUsage(claudeDir, options?)`

Analyzes Claude Code usage from the specified directory.

- `claudeDir`: Path to Claude directory (typically `~/.claude`)
- `options`: Optional configuration object
  - `targetDate`: Filter by specific date (YYYY-MM-DD format)
  - `projectFilter`: Filter projects by name
  - `includeCompletedTodos`: Include completed TODOs (default: true)

#### `loadTodos(todosDir, sessionId, options?)`

Loads TODOs for a specific session.

#### `loadAllTodos(claudeDir, options?)`

Loads all TODOs from the todos directory.

### Types

```typescript
interface ClaudeAnalysisResult {
  projects: ClaudeProject[];
  totalSessions: number;
  totalMessages: number;
  analysisPeriod: {
    start: string;
    end: string;
  };
}

interface ClaudeProject {
  name: string;
  path: string;
  sessions: ClaudeSession[];
  lastActivity: string;
  totalMessages: number;
  totalSessions: number;
}

interface ClaudeSession {
  id: string;
  messages: ClaudeMessage[];
  startTime: string;
  endTime: string;
  cwd: string;
  messageCount: number;
}

interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  id: string;
}
```

### Utilities

- `getProjectStats(project)`: Get project statistics
- `getSessionDuration(session)`: Calculate session duration
- `filterTodosByStatus(todos, status)`: Filter TODOs by status
- `getTodoCompletionRate(todos)`: Calculate completion rate
- `getMostActiveProject(projects)`: Find most active project
- `getRecentActivity(projects, days)`: Get recent activity
- `getActivityTimeline(projects, days)`: Get activity timeline

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Lint
pnpm lint

# Format
pnpm format
```

## License

MIT

## Related Projects

- [ccsummary](https://github.com/yoshikouki/ccsummary) - CLI tool that uses this library to generate daily reports
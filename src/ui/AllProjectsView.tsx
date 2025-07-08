import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ClaudeAnalysisResult, ClaudeMessage } from '../types/index.js';
import { loadTodos } from '../core/analyzer.js';
import dayjs from 'dayjs';

interface AllProjectsViewProps {
  analysisResult: ClaudeAnalysisResult;
  targetDate: string;
}

type TabType = 'overview' | 'prompts' | 'todos';

const AllProjectsView: React.FC<AllProjectsViewProps> = ({
  analysisResult,
  targetDate,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [allTodos, setAllTodos] = useState<any[]>([]);
  const [todosLoaded, setTodosLoaded] = useState(false);

  useInput((input) => {
    switch (input) {
      case '1':
        setActiveTab('overview');
        break;
      case '2':
        setActiveTab('prompts');
        break;
      case '3':
        setActiveTab('todos');
        if (!todosLoaded) {
          loadAllTodos();
        }
        break;
    }
  });

  const loadAllTodos = async () => {
    const todos: any[] = [];
    for (const project of analysisResult.projects) {
      for (const session of project.sessions) {
        try {
          const sessionTodos = await loadTodos(
            `${process.env.HOME}/.claude/todos`,
            session.id
          );
          sessionTodos.forEach(todo => {
            todos.push({ ...todo, projectName: project.name });
          });
        } catch (error) {
          // エラーは無視
        }
      }
    }
    setAllTodos(todos);
    setTodosLoaded(true);
  };

  const getAllUserMessages = (): Array<ClaudeMessage & { projectName: string }> => {
    const messages: Array<ClaudeMessage & { projectName: string }> = [];
    for (const project of analysisResult.projects) {
      for (const session of project.sessions) {
        const userMessages = session.messages.filter(m => m.role === 'user');
        userMessages.forEach(msg => {
          messages.push({ ...msg, projectName: project.name });
        });
      }
    }
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const renderTabBar = () => (
    <Box marginBottom={1}>
      {(['overview', 'prompts', 'todos'] as TabType[]).map((tab, index) => {
        const tabNames = { overview: '概要', prompts: 'プロンプト', todos: 'TODO' };
        const isActive = activeTab === tab;
        return (
          <Box key={tab} marginRight={2}>
            <Text
              color={isActive ? 'cyan' : 'gray'}
              bold={isActive}
              inverse={isActive}
            >
              [{index + 1}] {tabNames[tab]}
            </Text>
          </Box>
        );
      })}
    </Box>
  );

  const renderOverview = () => {
    const completedTodos = allTodos.filter(t => t.status === 'completed');
    const pendingTodos = allTodos.filter(t => t.status === 'pending' || t.status === 'in_progress');
    
    return (
      <Box flexDirection="column">
        <Box borderStyle="round" borderColor="green" padding={1} marginBottom={1}>
          <Box flexDirection="column">
            <Text color="green" bold>📊 全体統計</Text>
            <Box justifyContent="space-between">
              <Text>プロジェクト数:</Text>
              <Text color="cyan" bold>{analysisResult.projects.length}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text>セッション数:</Text>
              <Text color="cyan" bold>{analysisResult.totalSessions}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text>メッセージ数:</Text>
              <Text color="cyan" bold>{analysisResult.totalMessages}</Text>
            </Box>
            {todosLoaded && (
              <Box justifyContent="space-between">
                <Text>タスク完了率:</Text>
                <Text color="yellow" bold>
                  {allTodos.length > 0 ? Math.round((completedTodos.length / allTodos.length) * 100) : 0}%
                </Text>
              </Box>
            )}
          </Box>
        </Box>

        <Box borderStyle="round" borderColor="blue" padding={1}>
          <Box flexDirection="column">
            <Text color="blue" bold>📂 プロジェクト別詳細</Text>
            {analysisResult.projects.map((project, index) => (
              <Box key={project.path} justifyContent="space-between">
                <Text>{index + 1}. {project.name}</Text>
                <Text color="gray">
                  {project.totalMessages}msg / {project.totalSessions}sess
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  };

  const renderPrompts = () => {
    const userMessages = getAllUserMessages();
    
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="yellow" bold>
            💬 プロンプト一覧 ({userMessages.length}件)
          </Text>
        </Box>
        
        {userMessages.slice(0, 10).map((message, index) => {
          const content = typeof message.content === 'string' 
            ? message.content 
            : JSON.stringify(message.content);
          const truncatedContent = content.length > 100 
            ? content.substring(0, 100) + '...' 
            : content;
            
          return (
            <Box key={`${message.sessionId}-${index}`} flexDirection="column" marginBottom={1}>
              <Box>
                <Text color="blue" bold>
                  [{message.projectName}] {dayjs(message.timestamp).format('HH:mm')}
                </Text>
              </Box>
              <Box>
                <Text>{truncatedContent}</Text>
              </Box>
            </Box>
          );
        })}
        
        {userMessages.length > 10 && (
          <Box marginTop={1}>
            <Text color="gray">
              ... and {userMessages.length - 10} more prompts
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  const renderTodos = () => {
    if (!todosLoaded) {
      return (
        <Box>
          <Text color="yellow">Loading TODOs...</Text>
        </Box>
      );
    }

    const completedTodos = allTodos.filter(t => t.status === 'completed');
    const inProgressTodos = allTodos.filter(t => t.status === 'in_progress');
    const pendingTodos = allTodos.filter(t => t.status === 'pending');

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="green" bold>
            ✅ 完了済み ({completedTodos.length}件)
          </Text>
        </Box>
        
        {completedTodos.slice(0, 5).map((todo, index) => (
          <Box key={`completed-${index}`} marginBottom={1}>
            <Text>
              <Text color="green">✓</Text> [{todo.projectName}] {todo.content}
            </Text>
          </Box>
        ))}

        {inProgressTodos.length > 0 && (
          <>
            <Box marginTop={1} marginBottom={1}>
              <Text color="yellow" bold>
                🔄 進行中 ({inProgressTodos.length}件)
              </Text>
            </Box>
            {inProgressTodos.map((todo, index) => (
              <Box key={`progress-${index}`} marginBottom={1}>
                <Text>
                  <Text color="yellow">◐</Text> [{todo.projectName}] {todo.content}
                </Text>
              </Box>
            ))}
          </>
        )}

        {pendingTodos.length > 0 && (
          <>
            <Box marginTop={1} marginBottom={1}>
              <Text color="red" bold>
                ⏳ 未着手 ({pendingTodos.length}件)
              </Text>
            </Box>
            {pendingTodos.slice(0, 5).map((todo, index) => (
              <Box key={`pending-${index}`} marginBottom={1}>
                <Text>
                  <Text color="red">○</Text> [{todo.projectName}] {todo.content}
                </Text>
              </Box>
            ))}
          </>
        )}
      </Box>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'prompts':
        return renderPrompts();
      case 'todos':
        return renderTodos();
      default:
        return <Text>Unknown tab</Text>;
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {renderTabBar()}
      {renderActiveTab()}
    </Box>
  );
};

export default AllProjectsView;
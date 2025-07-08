import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ClaudeProject, ClaudeMessage } from '../types/index.js';
import { loadTodos } from '../core/analyzer.js';
import dayjs from 'dayjs';

interface ProjectViewProps {
  project: ClaudeProject;
  targetDate: string;
}

type TabType = 'overview' | 'prompts' | 'todos';

const ProjectView: React.FC<ProjectViewProps> = ({ project, targetDate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [todos, setTodos] = useState<any[]>([]);
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
          loadProjectTodos();
        }
        break;
    }
  });

  const loadProjectTodos = async () => {
    const projectTodos: any[] = [];
    for (const session of project.sessions) {
      try {
        const sessionTodos = await loadTodos(
          `${process.env.HOME}/.claude/todos`,
          session.id
        );
        projectTodos.push(...sessionTodos);
      } catch (error) {
        // エラーは無視
      }
    }
    setTodos(projectTodos);
    setTodosLoaded(true);
  };

  const getUserMessages = (): ClaudeMessage[] => {
    const messages: ClaudeMessage[] = [];
    for (const session of project.sessions) {
      const userMessages = session.messages.filter(m => m.role === 'user');
      messages.push(...userMessages);
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
    const completedTodos = todos.filter(t => t.status === 'completed');
    const userMessages = getUserMessages();
    
    return (
      <Box flexDirection="column">
        <Box borderStyle="round" borderColor="green" padding={1} marginBottom={1}>
          <Box flexDirection="column">
            <Text color="green" bold>📊 プロジェクト情報</Text>
            <Box justifyContent="space-between">
              <Text>プロジェクト名:</Text>
              <Text color="cyan" bold>{project.name}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text>セッション数:</Text>
              <Text color="cyan" bold>{project.totalSessions}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text>メッセージ数:</Text>
              <Text color="cyan" bold>{project.totalMessages}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text>最終活動:</Text>
              <Text color="yellow">{dayjs(project.lastActivity).format('YYYY-MM-DD HH:mm')}</Text>
            </Box>
            {todosLoaded && (
              <Box justifyContent="space-between">
                <Text>タスク完了率:</Text>
                <Text color="yellow" bold>
                  {todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0}%
                </Text>
              </Box>
            )}
          </Box>
        </Box>

        <Box borderStyle="round" borderColor="blue" padding={1} marginBottom={1}>
          <Box flexDirection="column">
            <Text color="blue" bold>🚀 セッション詳細</Text>
            {project.sessions.map((session, index) => (
              <Box key={session.id} flexDirection="column" marginBottom={1}>
                <Box justifyContent="space-between">
                  <Text>Session {index + 1}:</Text>
                  <Text color="gray">{session.messageCount} messages</Text>
                </Box>
                <Box>
                  <Text color="gray">
                    {dayjs(session.startTime).format('HH:mm')} - {dayjs(session.endTime).format('HH:mm')}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {userMessages.length > 0 && (
          <Box borderStyle="round" borderColor="yellow" padding={1}>
            <Box flexDirection="column">
              <Text color="yellow" bold>💡 最近の主な活動</Text>
              {userMessages.slice(-3).map((message, index) => {
                const content = typeof message.content === 'string' 
                  ? message.content 
                  : JSON.stringify(message.content);
                const truncatedContent = content.length > 80 
                  ? content.substring(0, 80) + '...' 
                  : content;
                  
                return (
                  <Box key={index} flexDirection="column" marginBottom={1}>
                    <Text color="gray">
                      {dayjs(message.timestamp).format('HH:mm')}
                    </Text>
                    <Text>{truncatedContent}</Text>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderPrompts = () => {
    const userMessages = getUserMessages();
    
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="yellow" bold>
            💬 プロンプト詳細 ({userMessages.length}件)
          </Text>
        </Box>
        
        {userMessages.map((message, index) => {
          const content = typeof message.content === 'string' 
            ? message.content 
            : JSON.stringify(message.content);
            
          return (
            <Box key={`${message.sessionId}-${index}`} flexDirection="column" marginBottom={2}>
              <Box borderStyle="single" borderColor="blue" padding={1}>
                <Box flexDirection="column">
                  <Box justifyContent="space-between">
                    <Text color="blue" bold>#{index + 1}</Text>
                    <Text color="gray">{dayjs(message.timestamp).format('YYYY-MM-DD HH:mm:ss')}</Text>
                  </Box>
                  <Box marginTop={1}>
                    <Text>{content}</Text>
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
        
        {userMessages.length === 0 && (
          <Box>
            <Text color="gray">この日はプロンプトがありませんでした。</Text>
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

    const completedTodos = todos.filter(t => t.status === 'completed');
    const inProgressTodos = todos.filter(t => t.status === 'in_progress');
    const pendingTodos = todos.filter(t => t.status === 'pending');

    return (
      <Box flexDirection="column">
        {completedTodos.length > 0 && (
          <>
            <Box marginBottom={1}>
              <Text color="green" bold>
                ✅ 完了済み ({completedTodos.length}件)
              </Text>
            </Box>
            
            {completedTodos.map((todo, index) => (
              <Box key={`completed-${index}`} marginBottom={1} borderStyle="single" borderColor="green" padding={1}>
                <Box flexDirection="column">
                  <Box justifyContent="space-between">
                    <Text color="green">✓ {todo.content}</Text>
                    <Text color="gray">{todo.priority}</Text>
                  </Box>
                </Box>
              </Box>
            ))}
          </>
        )}

        {inProgressTodos.length > 0 && (
          <>
            <Box marginTop={1} marginBottom={1}>
              <Text color="yellow" bold>
                🔄 進行中 ({inProgressTodos.length}件)
              </Text>
            </Box>
            {inProgressTodos.map((todo, index) => (
              <Box key={`progress-${index}`} marginBottom={1} borderStyle="single" borderColor="yellow" padding={1}>
                <Box flexDirection="column">
                  <Box justifyContent="space-between">
                    <Text color="yellow">◐ {todo.content}</Text>
                    <Text color="gray">{todo.priority}</Text>
                  </Box>
                </Box>
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
            {pendingTodos.map((todo, index) => (
              <Box key={`pending-${index}`} marginBottom={1} borderStyle="single" borderColor="red" padding={1}>
                <Box flexDirection="column">
                  <Box justifyContent="space-between">
                    <Text color="red">○ {todo.content}</Text>
                    <Text color="gray">{todo.priority}</Text>
                  </Box>
                </Box>
              </Box>
            ))}
          </>
        )}

        {todos.length === 0 && (
          <Box>
            <Text color="gray">このプロジェクトにはTODOがありません。</Text>
          </Box>
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

export default ProjectView;
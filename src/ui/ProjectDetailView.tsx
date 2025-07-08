import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ClaudeProject, ClaudeSession, ClaudeMessage } from '../types/index.js';
import { loadTodos } from '../core/analyzer.js';
import dayjs from 'dayjs';

interface ProjectDetailViewProps {
  project: ClaudeProject;
  targetDate: string;
}

type ViewMode = 'sessions' | 'messages' | 'conversation' | 'search';
type DetailLevel = 'list' | 'detail';

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, targetDate }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('sessions');
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('list');
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [todos, setTodos] = useState<any[]>([]);
  const [todosLoaded, setTodosLoaded] = useState(false);

  const currentSession = project.sessions[selectedSessionIndex];
  const allMessages = project.sessions.flatMap(s => s.messages);
  const userMessages = allMessages.filter(m => m.role === 'user');
  const assistantMessages = allMessages.filter(m => m.role === 'assistant');

  useInput((input, key) => {
    if (detailLevel === 'list') {
      switch (input) {
        case '1':
          setViewMode('sessions');
          break;
        case '2':
          setViewMode('messages');
          break;
        case '3':
          setViewMode('conversation');
          break;
        case '4':
          setViewMode('search');
          break;
        case 'j':
        case 'ArrowDown':
          if (viewMode === 'sessions') {
            setSelectedSessionIndex(Math.min(selectedSessionIndex + 1, project.sessions.length - 1));
          } else if (viewMode === 'messages') {
            setSelectedMessageIndex(Math.min(selectedMessageIndex + 1, userMessages.length - 1));
          }
          break;
        case 'k':
        case 'ArrowUp':
          if (viewMode === 'sessions') {
            setSelectedSessionIndex(Math.max(selectedSessionIndex - 1, 0));
          } else if (viewMode === 'messages') {
            setSelectedMessageIndex(Math.max(selectedMessageIndex - 1, 0));
          }
          break;
        case 'Enter':
          setDetailLevel('detail');
          break;
      }
    } else {
      switch (input) {
        case 'Escape':
        case 'b':
          setDetailLevel('list');
          break;
        case 'j':
        case 'ArrowDown':
          if (viewMode === 'conversation' && currentSession) {
            setSelectedMessageIndex(Math.min(selectedMessageIndex + 1, currentSession.messages.length - 1));
          }
          break;
        case 'k':
        case 'ArrowUp':
          if (viewMode === 'conversation' && currentSession) {
            setSelectedMessageIndex(Math.max(selectedMessageIndex - 1, 0));
          }
          break;
      }
    }
  });

  const loadProjectTodos = async () => {
    if (todosLoaded) return;
    
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

  useEffect(() => {
    loadProjectTodos();
  }, []);

  const renderModeSelector = () => (
    <Box marginBottom={1}>
      {(['sessions', 'messages', 'conversation', 'search'] as ViewMode[]).map((mode, index) => {
        const modeNames = { 
          sessions: 'セッション', 
          messages: 'メッセージ', 
          conversation: '会話',
          search: '検索'
        };
        const isActive = viewMode === mode;
        return (
          <Box key={mode} marginRight={2}>
            <Text
              color={isActive ? 'cyan' : 'gray'}
              bold={isActive}
              inverse={isActive}
            >
              [{index + 1}] {modeNames[mode]}
            </Text>
          </Box>
        );
      })}
    </Box>
  );

  const renderNavigationHelp = () => (
    <Box borderStyle="single" borderColor="gray" padding={1} marginTop={1}>
      <Box flexDirection="column">
        <Text color="gray">
          {detailLevel === 'list' 
            ? "↑↓/j/k: 選択  Enter: 詳細  1-4: モード切り替え"
            : "↑↓/j/k: スクロール  Esc/b: 戻る"
          }
        </Text>
      </Box>
    </Box>
  );

  const renderSessionsList = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="blue" bold>
          📁 セッション一覧 ({project.sessions.length}件)
        </Text>
      </Box>
      
      {project.sessions.map((session, index) => {
        const isSelected = index === selectedSessionIndex;
        const duration = dayjs(session.endTime).diff(dayjs(session.startTime), 'minute');
        
        return (
          <Box
            key={session.id}
            borderStyle={isSelected ? "double" : "single"}
            borderColor={isSelected ? "cyan" : "gray"}
            padding={1}
            marginBottom={1}
          >
            <Box flexDirection="column" width="100%">
              <Box justifyContent="space-between">
                <Text color={isSelected ? "cyan" : "white"} bold>
                  Session {index + 1}
                </Text>
                <Text color="gray">
                  {session.messageCount} messages • {duration}分
                </Text>
              </Box>
              <Box justifyContent="space-between">
                <Text color="gray">
                  {dayjs(session.startTime).format('YYYY-MM-DD HH:mm')}
                </Text>
                <Text color="gray">
                  {dayjs(session.endTime).format('HH:mm')}
                </Text>
              </Box>
              {isSelected && session.messages.length > 0 && (
                <Box marginTop={1}>
                  <Text color="yellow">
                    最初のメッセージ: {typeof session.messages[0].content === 'string' 
                      ? session.messages[0].content.substring(0, 60) + '...'
                      : '[複雑なコンテンツ]'
                    }
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  const renderSessionDetail = () => {
    if (!currentSession) {
      return <Text color="red">セッションが見つかりません</Text>;
    }

    return (
      <Box flexDirection="column">
        <Box borderStyle="double" borderColor="cyan" padding={1} marginBottom={1}>
          <Box flexDirection="column">
            <Text color="cyan" bold>
              📋 Session {selectedSessionIndex + 1} 詳細
            </Text>
            <Box justifyContent="space-between">
              <Text>開始時刻:</Text>
              <Text color="yellow">{dayjs(currentSession.startTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text>終了時刻:</Text>
              <Text color="yellow">{dayjs(currentSession.endTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text>メッセージ数:</Text>
              <Text color="cyan">{currentSession.messageCount}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text>継続時間:</Text>
              <Text color="green">
                {dayjs(currentSession.endTime).diff(dayjs(currentSession.startTime), 'minute')}分
              </Text>
            </Box>
          </Box>
        </Box>

        <Box borderStyle="single" borderColor="blue" padding={1}>
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text color="blue" bold>💬 会話の流れ</Text>
            </Box>
            {currentSession.messages.slice(0, 10).map((message, index) => {
              const content = typeof message.content === 'string' 
                ? message.content 
                : JSON.stringify(message.content);
              const isUser = message.role === 'user';
              
              return (
                <Box key={index} marginBottom={1}>
                  <Box flexDirection="column">
                    <Box justifyContent="space-between">
                      <Text color={isUser ? "green" : "blue"} bold>
                        {isUser ? "👤 User" : "🤖 Assistant"}
                      </Text>
                      <Text color="gray">
                        {dayjs(message.timestamp).format('HH:mm:ss')}
                      </Text>
                    </Box>
                    <Text>{content.substring(0, 100)}{content.length > 100 ? '...' : ''}</Text>
                  </Box>
                </Box>
              );
            })}
            {currentSession.messages.length > 10 && (
              <Text color="gray">...他 {currentSession.messages.length - 10} メッセージ</Text>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const renderMessagesList = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="green" bold>
          💬 ユーザーメッセージ一覧 ({userMessages.length}件)
        </Text>
      </Box>
      
      {userMessages.map((message, index) => {
        const isSelected = index === selectedMessageIndex;
        const content = typeof message.content === 'string' 
          ? message.content 
          : JSON.stringify(message.content);
        
        return (
          <Box
            key={`${message.sessionId}-${index}`}
            borderStyle={isSelected ? "double" : "single"}
            borderColor={isSelected ? "green" : "gray"}
            padding={1}
            marginBottom={1}
          >
            <Box flexDirection="column" width="100%">
              <Box justifyContent="space-between">
                <Text color={isSelected ? "green" : "white"} bold>
                  Message {index + 1}
                </Text>
                <Text color="gray">
                  {dayjs(message.timestamp).format('MM-DD HH:mm')}
                </Text>
              </Box>
              <Box marginBottom={1}>
                <Text color="gray">
                  Session: {project.sessions.findIndex(s => s.id === message.sessionId) + 1}
                </Text>
              </Box>
              <Text>
                {isSelected 
                  ? content
                  : content.substring(0, 80) + (content.length > 80 ? '...' : '')
                }
              </Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  const renderConversationView = () => {
    if (!currentSession) {
      return <Text color="red">セッションが選択されていません</Text>;
    }

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="purple" bold>
            🗣️ 会話詳細 - Session {selectedSessionIndex + 1}
          </Text>
        </Box>
        
        {currentSession.messages.map((message, index) => {
          const isSelected = index === selectedMessageIndex;
          const content = typeof message.content === 'string' 
            ? message.content 
            : JSON.stringify(message.content);
          const isUser = message.role === 'user';
          
          return (
            <Box
              key={index}
              borderStyle={isSelected ? "double" : "single"}
              borderColor={isSelected ? "purple" : (isUser ? "green" : "blue")}
              padding={1}
              marginBottom={1}
            >
              <Box flexDirection="column" width="100%">
                <Box justifyContent="space-between">
                  <Text color={isUser ? "green" : "blue"} bold>
                    {isUser ? "👤 User" : "🤖 Assistant"} #{index + 1}
                  </Text>
                  <Text color="gray">
                    {dayjs(message.timestamp).format('HH:mm:ss')}
                  </Text>
                </Box>
                <Box marginTop={1}>
                  <Text>{content}</Text>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderSearchView = () => (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="red" bold>
          🔍 検索機能 (実装予定)
        </Text>
      </Box>
      <Box borderStyle="single" borderColor="yellow" padding={1}>
        <Box flexDirection="column">
          <Text color="yellow">近日実装予定の機能:</Text>
          <Text>• キーワード検索</Text>
          <Text>• 日付範囲フィルター</Text>
          <Text>• メッセージタイプフィルター</Text>
          <Text>• 正規表現サポート</Text>
        </Box>
      </Box>
    </Box>
  );

  const renderContent = () => {
    if (detailLevel === 'detail') {
      switch (viewMode) {
        case 'sessions':
          return renderSessionDetail();
        case 'conversation':
          return renderConversationView();
        default:
          setDetailLevel('list');
          return null;
      }
    }

    switch (viewMode) {
      case 'sessions':
        return renderSessionsList();
      case 'messages':
        return renderMessagesList();
      case 'conversation':
        return renderConversationView();
      case 'search':
        return renderSearchView();
      default:
        return <Text>Unknown view mode</Text>;
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="magenta" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text color="magenta" bold>
            🔍 {project.name} - 詳細探索
          </Text>
          <Box justifyContent="space-between">
            <Text>総セッション: {project.sessions.length}</Text>
            <Text>総メッセージ: {project.totalMessages}</Text>
            <Text>TODOs: {todos.length}</Text>
          </Box>
        </Box>
      </Box>

      {renderModeSelector()}
      {renderContent()}
      {renderNavigationHelp()}
    </Box>
  );
};

export default ProjectDetailView;
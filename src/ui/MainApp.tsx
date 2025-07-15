import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdin } from 'ink';
import { ClaudeAnalysisResult } from '../types/index.js';
import ProjectSelector from './ProjectSelector.js';
import ProjectView from './ProjectView.js';
import ProjectDetailView from './ProjectDetailView.js';
import AllProjectsView from './AllProjectsView.js';
import { useTerminalSize } from './hooks/useTerminalSize.js';

interface MainAppProps {
  analysisResult: ClaudeAnalysisResult;
  targetDate: string;
}

type ViewMode = 'selector' | 'all-projects' | 'single-project' | 'project-detail';

const MainApp: React.FC<MainAppProps> = ({ analysisResult, targetDate }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('selector');
  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(null);
  const { exit } = useApp();
  const { stdin, isRawModeSupported } = useStdin();
  const terminalSize = useTerminalSize();

  useInput((input, key) => {
    try {
      if (input === 'q' || key.escape) {
        exit();
      }
      if (key.backspace || input === 'b') {
        if (viewMode === 'single-project' || viewMode === 'project-detail') {
          setViewMode('selector');
          setSelectedProjectPath(null);
        } else if (viewMode === 'all-projects') {
          setViewMode('selector');
        }
      }
      if (input === 'd' && viewMode === 'single-project') {
        setViewMode('project-detail');
      }
    } catch (error) {
      // Ignore input errors to prevent crashes
    }
  });

  const handleSelectAllProjects = () => {
    setViewMode('all-projects');
  };

  const handleSelectProject = (projectPath: string) => {
    setSelectedProjectPath(projectPath);
    setViewMode('single-project');
  };

  const renderCurrentView = () => {
    // Debug: More accurate height calculation
    const headerHeight = 4; // Double border + 2 text lines
    const footerHeight = 3; // Single border + 1 text line
    const availableHeight = Math.max(5, terminalSize.height - headerHeight - footerHeight);
    
    // Debug: Log height calculations (removed for production)
    
    switch (viewMode) {
      case 'selector':
        return (
          <ProjectSelector
            projects={analysisResult.projects}
            onSelectAll={handleSelectAllProjects}
            onSelectProject={handleSelectProject}
          />
        );
      case 'all-projects':
        return (
          <AllProjectsView
            analysisResult={analysisResult}
            targetDate={targetDate}
            terminalHeight={availableHeight}
          />
        );
      case 'single-project':
        const project = selectedProjectPath ? analysisResult.projects.find(p => p.path === selectedProjectPath) : null;
        return project ? (
          <ProjectView
            project={project}
            targetDate={targetDate}
            terminalHeight={availableHeight}
          />
        ) : (
          <Text color="red">Project not found</Text>
        );
      case 'project-detail':
        const detailProject = selectedProjectPath ? analysisResult.projects.find(p => p.path === selectedProjectPath) : null;
        return detailProject ? (
          <ProjectDetailView
            project={detailProject}
            targetDate={targetDate}
            terminalHeight={availableHeight}
          />
        ) : (
          <Text color="red">Project not found</Text>
        );
      default:
        return <Text>Unknown view mode</Text>;
    }
  };

  const getCurrentTitle = () => {
    switch (viewMode) {
      case 'selector':
        return '📁 Project Selection';
      case 'all-projects':
        return '🌐 All Projects Cross-View';
      case 'single-project':
        const currentProject = selectedProjectPath ? analysisResult.projects.find(p => p.path === selectedProjectPath) : null;
        return `📂 ${currentProject?.name || 'Unknown'}`;
      case 'project-detail':
        const currentDetailProject = selectedProjectPath ? analysisResult.projects.find(p => p.path === selectedProjectPath) : null;
        return `🔍 ${currentDetailProject?.name || 'Unknown'} - Details`;
      default:
        return 'Claude Code Summary';
    }
  };

  // Check if interactive mode is supported
  if (!isRawModeSupported) {
    useEffect(() => {
      const timer = setTimeout(() => {
        exit();
      }, 5000);
      return () => clearTimeout(timer);
    }, [exit]);
    
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">⚠️  Interactive mode is not supported in this environment.</Text>
        <Text color="blue">Use the following commands instead:</Text>
        <Text>  ccsummary generate  - Generate reports</Text>
        <Text>  ccsummary list      - List projects</Text>
        <Text>  ccsummary dashboard - View dashboard</Text>
        <Text color="gray">\nNote: This typically happens in non-TTY environments.</Text>
        <Text color="gray">Try running in a proper terminal or use the dashboard command instead.</Text>
        <Text color="gray">\nThis message will auto-exit in 5 seconds...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box borderStyle="double" borderColor="cyan" paddingX={2}>
        <Box flexDirection="column" width="100%">
          <Box justifyContent="center">
            <Text color="cyan" bold>
              ⚡ Claude Code Interactive Summary
            </Text>
          </Box>
          <Box justifyContent="center">
            <Text color="yellow">
              {getCurrentTitle()} - {new Date(targetDate).toLocaleDateString('en-US')}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Content with virtual scroll - uses flexGrow to fill remaining space */}
      <Box flexGrow={1}>
        {renderCurrentView()}
      </Box>

      {/* Footer */}
      <Box borderStyle="single" borderColor="gray" paddingX={2}>
        <Box justifyContent="space-between" width="100%">
          <Text color="gray">
            {viewMode !== 'selector' ? '[B]ack' : ''} 
            {viewMode === 'single-project' ? ' [D]etail' : ''} 
            {' [Q]uit'}
          </Text>
          <Text color="gray">
            {viewMode === 'selector' || viewMode === 'all-projects' 
              ? "Use ↑↓ to navigate, Enter to select"
              : viewMode === 'single-project' 
                ? "1-3: tabs, D: detail view"
                : "See navigation help below"
            }
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default MainApp;
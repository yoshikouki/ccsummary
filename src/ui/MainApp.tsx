import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { ClaudeAnalysisResult } from '../types';
import ProjectSelector from './ProjectSelector';
import ProjectView from './ProjectView';
import AllProjectsView from './AllProjectsView';

interface MainAppProps {
  analysisResult: ClaudeAnalysisResult;
  targetDate: string;
}

type ViewMode = 'selector' | 'all-projects' | 'single-project';

const MainApp: React.FC<MainAppProps> = ({ analysisResult, targetDate }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('selector');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
    }
    if (key.backspace || input === 'b') {
      if (viewMode === 'single-project') {
        setViewMode('selector');
        setSelectedProject(null);
      } else if (viewMode === 'all-projects') {
        setViewMode('selector');
      }
    }
  });

  const handleSelectAllProjects = () => {
    setViewMode('all-projects');
  };

  const handleSelectProject = (projectName: string) => {
    setSelectedProject(projectName);
    setViewMode('single-project');
  };

  const renderCurrentView = () => {
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
          />
        );
      case 'single-project':
        const project = analysisResult.projects.find(p => p.name === selectedProject);
        return project ? (
          <ProjectView
            project={project}
            targetDate={targetDate}
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
        return '📁 プロジェクト選択';
      case 'all-projects':
        return '🌐 全プロジェクト横断ビュー';
      case 'single-project':
        return `📂 ${selectedProject}`;
      default:
        return 'Claude Code Summary';
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="double" borderColor="cyan" paddingX={2} marginBottom={1}>
        <Box flexDirection="column" width="100%">
          <Box justifyContent="center">
            <Text color="cyan" bold>
              ⚡ Claude Code Interactive Summary
            </Text>
          </Box>
          <Box justifyContent="center">
            <Text color="yellow">
              {getCurrentTitle()} - {new Date(targetDate).toLocaleDateString('ja-JP')}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box flexGrow={1}>
        {renderCurrentView()}
      </Box>

      {/* Footer */}
      <Box borderStyle="single" borderColor="gray" paddingX={2} marginTop={1}>
        <Box justifyContent="space-between" width="100%">
          <Text color="gray">
            {viewMode !== 'selector' ? '[B]ack' : ''} [Q]uit
          </Text>
          <Text color="gray">
            Use ↑↓ to navigate, Enter to select
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default MainApp;
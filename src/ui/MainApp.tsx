import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdin } from 'ink';
import { ClaudeAnalysisResult } from '../types/index.js';
import ProjectSelector from './ProjectSelector.js';
import ProjectView from './ProjectView.js';
import ProjectDetailView from './ProjectDetailView.js';
import AllProjectsView from './AllProjectsView.js';

interface MainAppProps {
  analysisResult: ClaudeAnalysisResult;
  targetDate: string;
}

type ViewMode = 'selector' | 'all-projects' | 'single-project' | 'project-detail';

const MainApp: React.FC<MainAppProps> = ({ analysisResult, targetDate }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('selector');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { exit } = useApp();
  const { stdin, isRawModeSupported } = useStdin();

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
    }
    if (key.backspace || input === 'b') {
      if (viewMode === 'single-project' || viewMode === 'project-detail') {
        setViewMode('selector');
        setSelectedProject(null);
      } else if (viewMode === 'all-projects') {
        setViewMode('selector');
      }
    }
    if (input === 'd' && viewMode === 'single-project') {
      setViewMode('project-detail');
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
      case 'project-detail':
        const detailProject = analysisResult.projects.find(p => p.name === selectedProject);
        return detailProject ? (
          <ProjectDetailView
            project={detailProject}
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
      case 'project-detail':
        return `🔍 ${selectedProject} - 詳細`;
      default:
        return 'Claude Code Summary';
    }
  };

  // Check if interactive mode is supported
  if (!isRawModeSupported) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">⚠️  Interactive mode is not supported in this environment.</Text>
        <Text color="blue">Use the following commands instead:</Text>
        <Text>  ccsummary generate  - Generate reports</Text>
        <Text>  ccsummary list      - List projects</Text>
        <Text>  ccsummary dashboard - View dashboard</Text>
      </Box>
    );
  }

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
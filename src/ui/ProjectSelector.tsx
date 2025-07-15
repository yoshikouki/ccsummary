import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { ClaudeProject } from '../types/index.js';

interface ProjectSelectorProps {
  projects: ClaudeProject[];
  onSelectAll: () => void;
  onSelectProject: (projectPath: string) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  onSelectAll,
  onSelectProject,
}) => {
  const items = [
    {
      label: '🌐 All Projects Cross-View',
      value: '__all__',
    },
    ...projects.map((project) => ({
      label: `📂 ${project.name} (${project.totalMessages}msg, ${project.totalSessions}sess)`,
      value: project.path, // Use project.path as unique identifier
    })),
  ];

  const handleSelect = (item: { label: string; value: string }) => {
    if (item.value === '__all__') {
      onSelectAll();
    } else {
      onSelectProject(item.value);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color="green" bold>
          📋 Please select a project to display
        </Text>
      </Box>

      {projects.length === 0 ? (
        <Box borderStyle="round" borderColor="yellow" padding={1}>
          <Text color="yellow">
            No activity on this day. Please try another date.
          </Text>
        </Box>
      ) : (
        <>
          <Box marginBottom={1}>
            <Text color="blue">
              {projects.length} projects found:
            </Text>
          </Box>

          <SelectInput items={items} onSelect={handleSelect} />

          <Box marginTop={2} borderStyle="round" borderColor="blue" padding={1}>
            <Box flexDirection="column">
              <Text color="blue" bold>
                💡 Display Options
              </Text>
              <Text>• All Projects: Overall statistics and prompts/TODO list</Text>
              <Text>• Individual Project: Detailed information for a specific project</Text>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ProjectSelector;
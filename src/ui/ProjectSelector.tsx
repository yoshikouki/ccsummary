import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { ClaudeProject } from '../types/index.js';

interface ProjectSelectorProps {
  projects: ClaudeProject[];
  onSelectAll: () => void;
  onSelectProject: (projectName: string) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  onSelectAll,
  onSelectProject,
}) => {
  const items = [
    {
      label: '🌐 全プロジェクト横断ビュー',
      value: '__all__',
    },
    ...projects.map(project => ({
      label: `📂 ${project.name} (${project.totalMessages}msg, ${project.totalSessions}sess)`,
      value: project.name,
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
          📋 表示するプロジェクトを選択してください
        </Text>
      </Box>

      {projects.length === 0 ? (
        <Box borderStyle="round" borderColor="yellow" padding={1}>
          <Text color="yellow">
            この日は活動がありませんでした。別の日付を試してください。
          </Text>
        </Box>
      ) : (
        <>
          <Box marginBottom={1}>
            <Text color="blue">
              {projects.length}個のプロジェクトが見つかりました：
            </Text>
          </Box>

          <SelectInput items={items} onSelect={handleSelect} />

          <Box marginTop={2} borderStyle="round" borderColor="blue" padding={1}>
            <Box flexDirection="column">
              <Text color="blue" bold>
                💡 表示オプション
              </Text>
              <Text>• 全プロジェクト横断: 全体の統計とプロンプト・TODO一覧</Text>
              <Text>• 個別プロジェクト: 特定プロジェクトの詳細情報</Text>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ProjectSelector;
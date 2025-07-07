#!/usr/bin/env node

import { Command } from 'commander';
import { generateReport } from './core/reporter';
import { analyzeClaudeDirectory } from './core/analyzer';
import chalk from 'chalk';
import ora from 'ora';
import dayjs from 'dayjs';
// React Ink imports are done dynamically to avoid module resolution issues

const program = new Command();

program
  .name('ccsummary')
  .description('Claude Code usage summary generator')
  .version('1.0.0')
  .action(async () => {
    // Default action - run interactive mode
    const { render } = await import('ink');
    const React = await import('react');
    const MainApp = (await import('./ui/MainApp.js')).default;
    
    const spinner = ora('Loading Claude Code data...').start();
    
    try {
      const analysisResult = await analyzeClaudeDirectory('~/.claude');
      spinner.stop();
      
      render(React.createElement(MainApp, {
        analysisResult,
        targetDate: dayjs().format('YYYY-MM-DD')
      }));
      
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate daily report for Claude Code usage')
  .option('-d, --date <date>', 'Target date (YYYY-MM-DD)', dayjs().format('YYYY-MM-DD'))
  .option('-o, --output <path>', 'Output directory', '~/ccsummary')
  .option('-p, --project <name>', 'Specific project name to analyze')
  .option('--claude-dir <path>', 'Path to .claude directory', '~/.claude')
  .action(async (options) => {
    const spinner = ora('Analyzing Claude Code usage...').start();
    
    try {
      const analysisResult = await analyzeClaudeDirectory(options.claudeDir, options.date);
      spinner.text = 'Generating report...';
      
      const reports = await generateReport(analysisResult, {
        date: options.date,
        outputDir: options.output,
        projectFilter: options.project
      });
      
      spinner.succeed(`Reports generated successfully!`);
      
      console.log(chalk.blue('\n📊 Generated Reports:'));
      console.log(`${chalk.yellow('All Projects:')}`);
      console.log(`  Summary: ${chalk.green(reports.all.summaryPath)}`);
      console.log(`  Prompts: ${chalk.green(reports.all.promptsPath)}`);
      console.log(`  TODOs: ${chalk.green(reports.all.todoPath)}`);
      
      if (reports.projects.size > 0) {
        console.log(`${chalk.yellow('\nProject-specific:')}`);
        for (const [projectName, projectReports] of reports.projects) {
          console.log(`  ${chalk.cyan(projectName)}:`);
          console.log(`    Summary: ${chalk.green(projectReports.summaryPath)}`);
          console.log(`    Prompts: ${chalk.green(projectReports.promptsPath)}`);
          console.log(`    TODOs: ${chalk.green(projectReports.todoPath)}`);
        }
      }
      
      console.log(chalk.blue('\n📊 Summary:'));
      console.log(`${chalk.yellow('Date:')} ${options.date}`);
      console.log(`${chalk.yellow('Projects:')} ${analysisResult.projects.length}`);
      console.log(`${chalk.yellow('Total Sessions:')} ${analysisResult.totalSessions}`);
      console.log(`${chalk.yellow('Total Messages:')} ${analysisResult.totalMessages}`);
      
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available projects')
  .option('--claude-dir <path>', 'Path to .claude directory', '~/.claude')
  .action(async (options) => {
    const spinner = ora('Scanning projects...').start();
    
    try {
      const analysisResult = await analyzeClaudeDirectory(options.claudeDir);
      spinner.stop();
      
      console.log(chalk.blue('\n📁 Available Projects:'));
      analysisResult.projects.forEach((project, index) => {
        console.log(`${index + 1}. ${chalk.green(project.name)}`);
        console.log(`   Path: ${chalk.gray(project.path)}`);
        console.log(`   Sessions: ${project.sessions.length}`);
        console.log(`   Last activity: ${dayjs(project.lastActivity).format('YYYY-MM-DD HH:mm')}`);
        console.log();
      });
      
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('dashboard')
  .description('Show interactive dashboard with real-time statistics')
  .option('-d, --date <date>', 'Target date (YYYY-MM-DD)', dayjs().format('YYYY-MM-DD'))
  .option('-p, --project <name>', 'Specific project name to analyze')
  .option('--claude-dir <path>', 'Path to .claude directory', '~/.claude')
  .action(async (options) => {
    const spinner = ora('Analyzing Claude Code usage...').start();
    
    try {
      const analysisResult = await analyzeClaudeDirectory(options.claudeDir, options.date);
      spinner.stop();
      
      // Filter projects if specified
      if (options.project) {
        analysisResult.projects = analysisResult.projects.filter(p => 
          p.name.includes(options.project)
        );
        analysisResult.totalSessions = analysisResult.projects.reduce((sum, p) => sum + p.totalSessions, 0);
        analysisResult.totalMessages = analysisResult.projects.reduce((sum, p) => sum + p.totalMessages, 0);
      }
      
      // Render React Ink dashboard
      const { render } = await import('ink');
      const React = await import('react');
      const SummaryDashboard = (await import('./ui/SummaryDashboard.js')).default;
      
      render(React.createElement(SummaryDashboard, {
        analysisResult,
        targetDate: options.date
      }));
      
    } catch (error) {
      spinner.fail(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program.parse();
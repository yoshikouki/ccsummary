#!/usr/bin/env node

import { Command } from 'commander';
import { generateReport } from './core/reporter';
import { analyzeClaudeDirectory } from './core/analyzer';
import chalk from 'chalk';
import ora from 'ora';
import dayjs from 'dayjs';

const program = new Command();

program
  .name('ccsummary')
  .description('Claude Code usage summary generator')
  .version('1.0.0');

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
      
      const reportPath = await generateReport(analysisResult, {
        date: options.date,
        outputDir: options.output,
        projectFilter: options.project
      });
      
      spinner.succeed(`Report generated: ${chalk.green(reportPath)}`);
      
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

program.parse();
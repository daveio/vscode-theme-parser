#!/usr/bin/env bun

/**
 * VSCode Theme Parser
 * A CLI tool to parse VS Code theme files and generate HTML reports
 *
 * Author: Dave Williams <dave@dave.io>
 * Website: https://dave.io
 */

import { Command } from 'commander';
import * as path from 'path';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';
import { registerHandlebarsHelpers, logError, logInfo } from './src/utils';
import { processTheme } from './src/parser';
import { showAboutScreen } from './src/about';
import * as fs from 'fs-extra';

// Register Handlebars helpers
registerHandlebarsHelpers();

// Create a new instance of the commander program
const program = new Command();

// Set up the CLI program details
program
  .name('vscode-theme-parser')
  .description(
    chalk.bold.green('VSCode Theme Parser') +
    chalk.gray(' - Generate HTML reports from VSCode theme files')
  )
  .version('1.0.0');

// Create parse command
const parseCommand = program
  .command('parse')
  .description('Parse a VSCode theme file and generate an HTML report')
  .requiredOption('-i, --input <path>', 'The input file path (.json or .vsix)')
  .requiredOption('-o, --output <path>', 'The output HTML file path')
  .action(async (options) => {
    const { input: inputPath, output: outputPath } = options;
    const opts = {};

    try {
      // Make paths absolute if they are relative
      const absoluteInputPath = path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
      const absoluteOutputPath = path.isAbsolute(outputPath) ? outputPath : path.resolve(process.cwd(), outputPath);

      // Get the template path
      const templatePath = path.join(__dirname, 'src', 'templates', 'theme-report.hbs');

      // Display a welcome banner
      console.log('\n' +
        chalk.bold.green('VSCode Theme Parser') +
        chalk.gray(' - Generating report...')
      );
      console.log(chalk.gray('─'.repeat(50)));

      // Process the theme file
      await processTheme(absoluteInputPath, absoluteOutputPath, templatePath);

      // Display a success message
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.bold.green('Success!'));
      console.log(chalk.green(`Report generated at: ${absoluteOutputPath}`));

      // Display a message about opening the report
      console.log(chalk.yellow('\nOpen the HTML file in your browser to view the report.'));
    } catch (error: unknown) {
      logError(`Failed to process theme: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Add the about command
program
  .command('about')
  .description('Display information about the author')
  .action(async () => {
    await showAboutScreen();
  });

// Default action if no command is specified
program.action(() => {
  if (process.argv.length <= 2) {
    console.log('\n' + chalk.bold.red('Error: No command specified'));
    console.log(chalk.yellow('Please specify a command to run. For example:'));
    console.log(chalk.green('  vscode-theme-parser parse --input <input-file> --output <output-file>'));
    console.log(chalk.green('  vscode-theme-parser about'));
    console.log('\nRun ' + chalk.cyan('vscode-theme-parser --help') + ' for more information.\n');
    process.exit(1);
  }
});

// Handle errors
program.showHelpAfterError();
program.showSuggestionAfterError();

// Parse the command line arguments
program.parse();

// If no command is specified, and no options are provided, show help
if (program.args.length === 0 && !process.argv.slice(2).some(arg => arg.startsWith('-'))) {
  program.outputHelp();
  process.exit(1);
}

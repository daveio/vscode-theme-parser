/**
 * About screen with animation for the VSCode Theme Parser
 * Displays information about the author in a colorful, animated way
 */

import chalk from 'chalk';
import { createSpinner } from 'nanospinner';

/**
 * ASCII art logo for the about screen
 */
const ASCII_LOGO = `VSCODE THEME PARSER`;

/**
 * Author information
 */
const AUTHOR_INFO = {
  name: 'Dave Williams',
  email: 'dave@dave.io',
  website: 'https://dave.io',
  github: 'https://github.com/daveio',
};

/**
 * Display the about screen with animations
 */
export async function showAboutScreen(): Promise<void> {
  // Clear the console
  console.clear();

  // Display the logo in rainbow colors
  const rainbowColors = [
    chalk.red,
    chalk.yellow,
    chalk.green,
    chalk.blue,
    chalk.magenta,
    chalk.cyan,
  ];

  // Print logo one line at a time with different colors
  const logoLines = ASCII_LOGO.split('\n');
  for (let i = 0; i < logoLines.length; i++) {
    const colorFn = rainbowColors[i % rainbowColors.length];
    console.log(colorFn(logoLines[i]));
    // Short delay between lines
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n');

  // Show a spinner with a message
  const spinner = createSpinner('Loading author information...').start();
  await new Promise(resolve => setTimeout(resolve, 1500));
  spinner.success({ text: 'Author information loaded!' });

  // Display author information with animation
  console.log('\n');

  const infoItems = [
    `${chalk.bold('Author:')}     ${chalk.green(AUTHOR_INFO.name)}`,
    `${chalk.bold('Email:')}      ${chalk.blue(AUTHOR_INFO.email)}`,
    `${chalk.bold('Website:')}    ${chalk.magenta(AUTHOR_INFO.website)}`,
    `${chalk.bold('GitHub:')}     ${chalk.cyan(AUTHOR_INFO.github)}`,
  ];

  for (const item of infoItems) {
    console.log(item);
    // Short delay between items
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Display a thank you message
  console.log('\n');
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(chalk.bold.yellow('Thank you for using VSCode Theme Parser!'));
  console.log(chalk.italic.gray('A tool to extract and visualize VSCode theme files'));
  console.log('\n');

  await new Promise(resolve => setTimeout(resolve, 1000));
}

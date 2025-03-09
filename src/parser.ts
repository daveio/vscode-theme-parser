/**
 * Parser module for VSCode theme files
 * Responsible for parsing .vsix files and theme JSON files
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yauzl from 'yauzl';
import extract from 'extract-zip';
import { promisify } from 'util';
import type { PackageInfo, TemplateData, VSCodeTheme } from './types';
import { createSpinner } from 'nanospinner';
import {
  fileExists,
  logDebug,
  logVerbose,
  logInfo,
  logWarning,
  logError,
  extractVSIX,
  listPackageContents,
  readExtensionManifest,
  readThemeFile,
  findThemeFilePath,
  renderTemplate
} from './utils';

/**
 * Processes a theme file directly (JSON format)
 * @param themePath - Path to the theme file
 * @returns Template data for rendering
 */
export async function processThemeFile(
  themePath: string
): Promise<TemplateData> {
  const spinner = createSpinner('Reading theme file...').start();

  try {
    // Read and parse the theme file
    const themeData = await fs.readJson(themePath) as VSCodeTheme;

    // Create minimal package info since we don't have a full extension
    const packageInfo: PackageInfo = {
      name: themeData.name || path.basename(themePath, path.extname(themePath)),
      displayName: themeData.displayName || themeData.name || 'Unknown Theme',
      description: themeData.description || 'No description provided',
      version: themeData.version || '1.0.0',
      publisher: themeData.publisher || 'Unknown',
      engines: { vscode: '*' },
      type: 'Standalone Theme File',
      identifier: 'standalone.theme'
    };

    const hasColors = !!themeData.colors && Object.keys(themeData.colors || {}).length > 0;
    const hasTokenColors = !!themeData.tokenColors && themeData.tokenColors.length > 0;

    spinner.success({ text: 'Theme file processed successfully' });

    return {
      theme: themeData,
      packageInfo,
      hasColors,
      hasTokenColors,
      packageContents: [path.basename(themePath)],
      generatedAt: new Date()
    };
  } catch (error) {
    spinner.error({ text: 'Failed to process theme file' });
    throw error;
  }
}

/**
 * Processes a .vsix extension file
 * @param vsixPath - Path to the .vsix file
 * @returns Template data for rendering
 */
export async function processVSIXFile(
  vsixPath: string
): Promise<TemplateData> {
  let extractPath = '';

  try {
    // Extract the VSIX to a temporary directory
    extractPath = await extractVSIX(vsixPath);
    logVerbose(`VSIX extracted to ${extractPath}`);

    // List all files in the package
    const packageContents = await listPackageContents(extractPath);
    logVerbose(`Found ${packageContents.length} files in the package`);

    // Read the extension manifest
    const packageSpinner = createSpinner('Reading extension manifest...').start();
    const packageInfo = await readExtensionManifest(extractPath);
    packageSpinner.success({ text: 'Extension manifest read successfully' });

    // Find the theme file path from the manifest
    const themePath = findThemeFilePath(packageInfo);
    if (!themePath) {
      throw new Error('No theme file found in the extension');
    }

    logVerbose(`Theme file found: ${themePath}`);

    // Read the theme file
    const themeSpinner = createSpinner('Reading theme file...').start();
    const themeData = await readThemeFile(extractPath, themePath);
    themeSpinner.success({ text: 'Theme file read successfully' });

    // Check if the theme has colors and token colors
    const hasColors = !!themeData.colors && Object.keys(themeData.colors || {}).length > 0;
    const hasTokenColors = !!themeData.tokenColors && themeData.tokenColors.length > 0;

    const result = {
      theme: themeData,
      packageInfo,
      hasColors,
      hasTokenColors,
      packageContents,
      generatedAt: new Date()
    };

    return result;
  } catch (error: unknown) {
    logError(`Error processing VSIX file: ${(error as Error).message}`);
    throw error;
  } finally {
    // Always clean up the temporary directory, even if an error occurred
    if (extractPath) {
      try {
        await fs.remove(extractPath);
        logVerbose(`Cleaned up temporary directory: ${extractPath}`);
      } catch (cleanupError) {
        logVerbose(`Failed to clean up temporary directory: ${extractPath}`);
      }
    }
  }
}

/**
 * Main function to process a theme file and generate an HTML report
 * @param inputPath - Path to the input file (JSON or VSIX)
 * @param outputPath - Path to the output HTML file
 * @param templatePath - Path to the Handlebars template
 */
export async function processTheme(
  inputPath: string,
  outputPath: string,
  templatePath: string
): Promise<void> {
  const fileExt = path.extname(inputPath).toLowerCase();

  logDebug(`Processing theme: ${inputPath} -> ${outputPath}`);

  try {
    // Check if input file exists
    if (!(await fileExists(inputPath))) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    let templateData: TemplateData;

    if (fileExt === '.vsix') {
      logInfo('Processing VSIX extension file');
      templateData = await processVSIXFile(inputPath);
    } else if (fileExt === '.json') {
      logInfo('Processing JSON theme file');
      templateData = await processThemeFile(inputPath);
    } else {
      throw new Error(`Unsupported file type: ${fileExt}. Only .json and .vsix files are supported.`);
    }

    // Render the template
    const renderSpinner = createSpinner('Generating HTML report...').start();
    const html = await renderTemplate(templatePath, templateData);
    renderSpinner.success({ text: 'HTML report generated successfully' });

    // Write the HTML to the output file
    const writeSpinner = createSpinner('Writing output file...').start();
    await fs.writeFile(outputPath, html);
    writeSpinner.success({ text: `Report saved to ${outputPath}` });

    logInfo(`Theme processed successfully. Report saved to ${outputPath}`);
  } catch (error: unknown) {
    logError(`Error processing theme: ${(error as Error).message}`);
    throw error;
  }
}

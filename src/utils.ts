/**
 * Utility functions for the VS Code theme parser
 */

import { exec } from "child_process";
import { exec } from "child_process";
import * as path from "path";
import { promisify } from "util";
import chalk from "chalk";
import extract from "extract-zip";
import extract from "extract-zip";
import * as fs from "fs-extra";
import Handlebars from "handlebars";
import { createSpinner } from "nanospinner";
import type { PackageInfo, VSCodeTheme } from "./types";

const execPromise = promisify(exec);

/**
 * Checks if a file exists
 * @param filePath - Path to the file to check
 * @returns Promise that resolves to a boolean indicating if the file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Formats a date for display
 * @param date - The date to format
 * @returns A formatted date string
 */
export function formatDate(date: Date): string {
	return date.toLocaleString();
}

/**
 * Helper function to log debug messages
 * @param message - The message to log
 */
export function logDebug(message: string): void {
	// Debug logging is disabled
}

/**
 * Helper function to log verbose messages
 * @param message - The message to log
 */
export function logVerbose(message: string): void {
	// Verbose logging is disabled
}

/**
 * Helper function to log information messages
 * @param message - The message to log
 */
export function logInfo(message: string): void {
	console.log(chalk.green("ℹ️ INFO:"), message);
}

/**
 * Helper function to log warning messages
 * @param message - The message to log
 */
export function logWarning(message: string): void {
	console.log(chalk.yellow("⚠️ WARNING:"), message);
}

/**
 * Helper function to log error messages
 * @param message - The message to log
 */
export function logError(message: string): void {
	console.log(chalk.red("❌ ERROR:"), message);
}

/**
 * Creates a temporary directory for extracting .vsix files
 * @returns Path to the created temporary directory
 */
export async function createTempDir(): Promise<string> {
	const tempDir = path.join(process.cwd(), ".temp-" + Date.now().toString());
	await fs.mkdir(tempDir, { recursive: true });
	return tempDir;
}

/**
 * Extracts a .vsix file to a temporary directory
 * @param vsixPath - Path to the .vsix file
 * @returns Path to the directory containing the extracted contents
 */
export async function extractVSIX(vsixPath: string): Promise<string> {
	const spinner = createSpinner("Extracting VSIX package...").start();
	const tempDir = await createTempDir();

	logVerbose(`Extracting ${vsixPath} to ${tempDir}`);

	try {
		// Check if the file exists before attempting extraction
		if (!(await fileExists(vsixPath))) {
			throw new Error(`VSIX file not found: ${vsixPath}`);
		}

		// Check if the file is readable
		try {
			await fs.access(vsixPath, fs.constants.R_OK);
		} catch (accessError) {
			throw new Error(`Cannot read VSIX file (permission denied): ${vsixPath}`);
		}

		// Log file info
		try {
			const stats = await fs.stat(vsixPath);
			logInfo(`VSIX file size: ${stats.size} bytes`);
			if (stats.size === 0) {
				throw new Error(`VSIX file is empty: ${vsixPath}`);
			}
		} catch (statError) {
			logWarning(`Could not get file stats: ${(statError as Error).message}`);
		}

		// Try to extract using extract-zip with detailed error reporting
		try {
			// Use absolute paths for both source and destination
			const absoluteVsixPath = path.isAbsolute(vsixPath)
				? vsixPath
				: path.resolve(process.cwd(), vsixPath);
			const absoluteTempDir = path.isAbsolute(tempDir)
				? tempDir
				: path.resolve(process.cwd(), tempDir);

			logInfo(`Extracting from: ${absoluteVsixPath}`);
			logInfo(`Extracting to: ${absoluteTempDir}`);

			await extract(absoluteVsixPath, { dir: absoluteTempDir });
		} catch (extractError) {
			// If extract-zip fails, provide detailed error information
			const errorMessage = (extractError as Error).message;
			const errorStack = (extractError as Error).stack;

			logError(`Extract-zip error: ${errorMessage}`);
			if (errorStack) {
				logVerbose(`Error stack: ${errorStack}`);
			}

			// Re-throw with more context
			throw new Error(`Failed to extract VSIX: ${errorMessage}`);
		}

		// Verify extraction succeeded by checking if files were created
		const extractedFiles = await fs.readdir(tempDir);
		if (extractedFiles.length === 0) {
			logWarning(
				"Extract-zip completed but no files were extracted. The directory is empty.",
			);

			// Try using system unzip command as fallback
			try {
				logInfo("Attempting extraction using system unzip command...");
				await execPromise(`unzip -q "${vsixPath}" -d "${tempDir}"`);

				// Check again
				const filesAfterUnzip = await fs.readdir(tempDir);
				if (filesAfterUnzip.length === 0) {
					throw new Error(
						"Extraction failed: No files were extracted with system unzip",
					);
				}

				logInfo(
					`Extraction with system unzip successful. Found ${filesAfterUnzip.length} files.`,
				);
			} catch (unzipError) {
				throw new Error(
					`All extraction methods failed: ${(unzipError as Error).message}`,
				);
			}
		}

		spinner.success({ text: "VSIX package extracted successfully" });
		return tempDir;
	} catch (error: unknown) {
		spinner.error({
			text: `Failed to extract VSIX: ${(error as Error).message}`,
		});
		// Clean up the temporary directory on failure
		try {
			await fs.remove(tempDir);
			logVerbose(
				`Cleaned up temporary directory after extraction failure: ${tempDir}`,
			);
		} catch (cleanupError) {
			logVerbose(`Failed to clean up temporary directory: ${tempDir}`);
		}
		throw error;
	}
}

/**
 * Lists all files in the extracted VSIX package
 * @param extractPath - Path to the extracted VSIX contents
 * @returns Array of file paths
 */
export async function listPackageContents(
	extractPath: string,
): Promise<string[]> {
	const allFiles: string[] = [];

	async function traverse(dir: string, baseDir: string) {
		const files = await fs.readdir(dir);

		for (const file of files) {
			const fullPath = path.join(dir, file);
			const relativePath = path.relative(baseDir, fullPath);
			const stat = await fs.stat(fullPath);

			if (stat.isDirectory()) {
				await traverse(fullPath, baseDir);
			} else {
				allFiles.push(relativePath);
			}
		}
	}

	await traverse(extractPath, extractPath);
	return allFiles.sort();
}

/**
 * Reads the extension manifest (package.json) from the extracted VSIX
 * @param extractPath - Path to the extracted VSIX contents
 * @returns Package information from the manifest
 */
export async function readExtensionManifest(
	extractPath: string,
): Promise<PackageInfo> {
	const packageJsonPath = path.join(extractPath, "extension", "package.json");
	const packageJson = await fs.readJson(packageJsonPath);

	// Add identifier in the format publisher.name
	packageJson.identifier = packageJson.publisher
		? `${packageJson.publisher}.${packageJson.name}`
		: packageJson.name;

	// Add extension type
	packageJson.type = "VS Code Extension";

	return packageJson as PackageInfo;
}

/**
 * Reads the VS Code theme file from the extracted VSIX
 * @param extractPath - Path to the extracted VSIX contents
 * @param themePath - Relative path to the theme file within the extension
 * @returns The parsed theme data
 */
export async function readThemeFile(
	extractPath: string,
	themePath: string,
): Promise<VSCodeTheme> {
	const fullThemePath = path.join(extractPath, "extension", themePath);
	return await fs.readJson(fullThemePath);
}

/**
 * Finds the theme file path from the extension manifest
 * @param packageInfo - The extension manifest
 * @returns Path to the theme file, or null if not found
 */
export function findThemeFilePath(packageInfo: PackageInfo): string | null {
	if (
		!packageInfo.contributes?.themes ||
		packageInfo.contributes.themes.length === 0
	) {
		return null;
	}

	// Return the first theme file path
	return packageInfo.contributes.themes[0].path;
}

/**
 * Registers Handlebars helpers for the template
 */
export function registerHandlebarsHelpers(): void {
	Handlebars.registerHelper("formatDate", (date: Date) => formatDate(date));

	Handlebars.registerHelper("json", (context) => JSON.stringify(context));
}

/**
 * Renders the template with the provided data
 * @param templatePath - Path to the Handlebars template
 * @param data - Data to pass to the template
 * @returns The rendered HTML
 */
export async function renderTemplate(
	templatePath: string,
	data: any,
): Promise<string> {
	const templateSource = await fs.readFile(templatePath, "utf-8");
	const template = Handlebars.compile(templateSource);
	return template(data);
}

/**
 * Interface representing a VS Code theme file structure
 * This includes both color theme properties and token color definitions
 */
export interface VSCodeTheme {
  name?: string;
  displayName?: string;
  description?: string;
  version?: string;
  publisher?: string;
  type?: 'dark' | 'light' | 'hc';
  colors?: Record<string, string>;
  tokenColors?: TokenColor[];
  semanticTokenColors?: Record<string, string | TokenSettings>;
  semanticHighlighting?: boolean;
}

/**
 * Interface representing a token color definition in a VS Code theme
 */
export interface TokenColor {
  name?: string;
  scope?: string | string[];
  settings: TokenSettings;
}

/**
 * Interface representing the settings for a token color
 */
export interface TokenSettings {
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

/**
 * Interface for representing metadata from the extension's package.json
 */
export interface PackageInfo {
  name: string;
  displayName: string;
  description: string;
  version: string;
  publisher: string;
  repository?: {
    type: string;
    url: string;
  };
  engines: {
    vscode: string;
  };
  categories?: string[];
  contributes?: {
    themes?: ThemeContribution[];
  };
  identifier?: string;
  type?: string;
}

/**
 * Interface representing a theme contribution in package.json
 */
export interface ThemeContribution {
  label: string;
  uiTheme: string;
  path: string;
}

/**
 * Interface for command line options
 */
export interface CommandOptions {
  input: string;
  output: string;
  debug: boolean;
  verbose: boolean;
}

/**
 * Interface for template data to be used with Handlebars
 */
export interface TemplateData {
  theme: VSCodeTheme;
  packageInfo: PackageInfo;
  hasColors: boolean;
  hasTokenColors: boolean;
  packageContents: string[];
  generatedAt: Date;
}
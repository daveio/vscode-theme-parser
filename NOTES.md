# VSCode Theme Parser

A command-line tool for parsing Visual Studio Code theme files (both JSON and VSIX) and generating HTML reports with color swatches and theme metadata.

## Overview

This tool allows you to extract and visualize the colors and metadata from VS Code theme files, making it easier to:

1. Understand the color palette of a theme
2. See all the token colorization rules
3. View extension package details
4. Explore the contents of a `.vsix` file

The output is a self-contained HTML file with color swatches that works in both light and dark mode.

## Features

- Parse both standalone `.json` theme files and packaged `.vsix` extensions
- Extract and display UI colors with color swatches in a hierarchical tree view
- Extract and display token colors with color swatches
- Show extension metadata (name, version, author, etc.)
- List all files contained within a `.vsix` package
- Generate a responsive HTML report that works on mobile and desktop
- Manual light/dark theme toggle in addition to system preference detection
- Animated and colorful CLI experience

## Architecture

The application is built with TypeScript and structured around the following components:

### Core Modules

1. **CLI Interface (`index.ts`)**
   - Main entry point for the application
   - Handles command-line argument parsing using Commander.js
   - Provides colorful user interface and help messages
   - Offers `--debug` and `--verbose` flags for detailed logging

2. **Theme Parser (`src/parser.ts`)**
   - Processes theme files (both `.json` and `.vsix`)
   - Extracts colors and metadata from theme files
   - Handles the conversion from raw data to template-ready format
   - Ensures proper cleanup of temporary files even when errors occur

3. **Utilities (`src/utils.ts`)**
   - Provides helper functions for file operations
   - Handles VSIX extraction and file listing
   - Contains logging utilities with color coding
   - Provides template rendering functions
   - Includes Handlebars helpers for date formatting and JSON string conversion

4. **About Screen (`src/about.ts`)**
   - Displays an animated screen with author information
   - Uses ASCII art and colorful animations

5. **Type Definitions (`src/types.ts`)**
   - Contains TypeScript interfaces for all data structures
   - Defines the structure of VSCode themes and extension manifests

### Data Flow

1. User invokes the CLI with input and output paths
2. The application validates inputs and determines file type
3. For VSIX files:
   - Extract to temporary directory
   - List all files in the package
   - Read the extension manifest
   - Find and parse the theme file
   - Clean up temporary files (guaranteed through finally blocks)
4. For JSON files:
   - Parse directly as a theme file
   - Create minimal package info
5. Generate template data with theme colors and metadata
6. Render the HTML template with Handlebars
7. Write the output file
8. Display success message

### Template System

The application uses Handlebars as a templating engine to generate the HTML report. The template is structured to:

1. Display theme metadata in the header
2. Show extension package details
3. Display UI colors in a hierarchical tree structure, categorized by namespace
4. Display token colors in a responsive grid
5. List all files in the package
6. Provide a footer with generation timestamp
7. Offer a light/dark mode toggle

## Usage Examples

### Parse a theme file

```bash
vscode-theme-parser parse --input path/to/theme.json --output output.html
```

### Parse a VSIX extension

```bash
vscode-theme-parser parse --input path/to/extension.vsix --output output.html
```

### Enable debug logging

```bash
vscode-theme-parser parse --input path/to/theme.json --output output.html --debug
```

### Show the about screen

```bash
vscode-theme-parser about
```

## Dependencies

- **commander**: Command-line argument parsing
- **chalk**: Colorful terminal output
- **ora** & **nanospinner**: Terminal spinners for progress indication
- **fs-extra**: Enhanced file system operations
- **extract-zip**: VSIX extraction (VSIX files are ZIP files)
- **yauzl**: Alternative ZIP handling for specific operations
- **handlebars**: HTML template rendering
- **xml2js**: XML parsing for VSIX manifest
- **TypeScript**: Static typing and modern JavaScript features
- **Bun**: Fast JavaScript/TypeScript runtime

## Output Report Structure

The generated HTML report includes:

1. **Header**: Theme name, display name, description, version, and publisher
2. **Package Details**: Extension ID, VS Code engine compatibility, categories
3. **Theme Type**: UI theme type and included components
4. **UI Colors**: All colors organized in a hierarchical tree structure by category (editor, terminal, etc.)
5. **Token Colors**: All token colorization rules with scopes and colors
6. **Package Contents**: Complete list of files in the VSIX package
7. **Footer**: Generation timestamp and author information
8. **Theme Toggle**: A button to switch between light and dark mode

The report uses Tailwind CSS for styling and includes both automatic and manual theme switching. By default, all color categories are expanded for easy browsing, and category names are displayed in monospace font for better readability.

## Future Enhancements

- Add ability to compare two themes side by side
- Generate color palette suggestions based on theme colors
- Extract color variables and relationships between colors
- Provide statistics about color usage in the theme
- Add search functionality for the HTML report
- Generate downloadable assets (color palettes for design tools)
- Support for exporting to other formats (PDF, JSON, etc.)

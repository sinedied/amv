# Copilot Instructions for amv - Quick AI Renamer

## Project Overview

`amv` is a CLI tool and web application for bulk renaming files and folders using AI. The tool starts a local web server with a simple UI where users can add files, define renaming rules, and let AI suggest new names before applying the changes.

## Architecture

- **CLI**: Commander.js-based CLI that starts the web server and opens browser
- **Backend**: Fastify server with REST API endpoints
- **Frontend**: Lit v3 web components with vanilla CSS
- **AI Integration**: OpenAI SDK configured for Ollama local LLM
- **Build Tool**: Vite for TypeScript compilation and bundling

## Tech Stack

- **Language**: TypeScript (ES2022 target, ESM modules)
- **Runtime**: Node.js v20+
- **Frontend**: Lit v3 web components, CSS variables, container queries
- **Backend**: Fastify server with @fastify/static
- **CLI**: Commander.js
- **AI**: OpenAI SDK with Ollama backend (default model: gemma3)
- **Build**: Vite

## Code Structure

```
src/
├── cli/              # CLI interface (Commander.js)
├── server/           # Fastify server and API endpoints
└── web/              # Lit web components
public/               # Static web assets
dist/                 # Build output
```

## Key Components

### CLI (`src/cli/index.ts`)
- Entry point executable (`#!/usr/bin/env node`)
- Commander.js configuration with options for port, model, auto-open
- Starts Fastify server and opens browser
- Handles graceful shutdown

### Server (`src/server/index.ts`)
- Fastify server with static file serving
- API endpoints:
  - `POST /api/suggest-names` - AI name suggestions
  - `POST /api/rename-files` - Execute file renaming
  - `GET /api/health` - Health check
- OpenAI client configured for Ollama (http://localhost:11434/v1)
- File system operations using Node.js fs/promises

### Web Components (`src/web/components.ts`)
- `<file-manager>` - File/folder selection with drag & drop
- `<rules-manager>` - AI rules input with localStorage persistence
- `<file-list>` - File table with preview and rename actions
- Event-driven communication between components

## Design Guidelines

### CSS Approach
- CSS custom properties (variables) for theming
- Flat design with subtle shadows
- No CSS frameworks - vanilla CSS with modern features
- Container queries for responsive design
- CSS nesting selectors

### Color Scheme
```css
:root {
  --primary-color: #4f46e5;
  --primary-hover: #3730a3;
  --background: #f8fafc;
  --surface: #ffffff;
  --text-primary: #111827;
  --border: #e5e7eb;
  --success: #10b981;
  --danger: #ef4444;
}
```

### TypeScript Standards
- Use `interface` for data structures
- Prefer functions over classes
- Use `undefined` instead of `null`
- Descriptive variable/function names
- Minimal comments - self-documenting code
- ESM imports/exports

### Error Handling
- Try-catch blocks with meaningful error messages
- HTTP status codes for API responses
- User-friendly error messages in UI
- Console logging for debugging

## AI Integration

### Ollama Configuration
- Base URL: `http://localhost:11434/v1`
- API key: `'ollama'` (placeholder, not validated)
- Default model: `gemma3`
- Model configurable via CLI `--model` flag

### Prompt Engineering
- Clear instructions for file renaming
- Include context about file types (file vs directory)
- Request JSON response format
- Fallback handling for non-JSON responses

## File Operations

### Supported Operations
- File and folder renaming using `fs.rename()`
- Drag & drop file selection
- Batch operations with individual error handling
- Path manipulation using Node.js `path` module

### Security Considerations
- Validate file paths to prevent directory traversal
- Handle permissions errors gracefully
- No file content modification - names only

## Development Workflow

### Build Process
1. TypeScript compilation via Vite
2. Bundle CLI and server as ESM modules
3. Copy web components to public directory
4. Static assets served from public/

### Local Development
```bash
npm run build    # Build all TypeScript
npm start        # Run CLI (starts server)
npm run dev      # Watch mode for development
```

### Testing Strategy
- Manual testing via web UI
- CLI parameter validation
- API endpoint testing
- File operation verification

## Key Features

### Core Functionality
1. **File Selection**: Drag & drop or browse for files/folders
2. **Rule Definition**: Natural language renaming rules
3. **AI Suggestions**: Generate new names using local LLM
4. **Preview**: Show original vs suggested names in table
5. **Batch Rename**: Apply changes to all selected files
6. **Persistence**: Save rules in localStorage

### User Experience
- Single command startup (`amv`)
- Auto-open browser
- Real-time feedback and loading states
- Error handling with user-friendly messages
- Responsive design for mobile/desktop

## Extension Points

### Adding New Features
- Additional AI providers (extend OpenAI client config)
- More file operations (copy, move, etc.)
- Advanced filtering and search
- Undo/redo functionality
- File content analysis for smarter naming

### Configuration Options
- Custom AI model selection
- Server port configuration
- UI theme customization
- Default rule templates

## Common Patterns

### Event Communication
```typescript
this.dispatchEvent(new CustomEvent('event-name', {
  detail: data,
  bubbles: true
}));
```

### API Calls
```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### State Management
```typescript
@state()
private propertyName = initialValue;
```

## Troubleshooting

### Common Issues
1. **Ollama not running**: Check localhost:11434 availability
2. **File permissions**: Ensure write access to target directories
3. **Port conflicts**: Use `--port` flag to specify different port
4. **Build errors**: Check TypeScript configuration and dependencies

### Dependencies
- All external dependencies should be production dependencies
- Minimal dependency footprint
- Use Node.js built-in modules where possible
- TypeScript and Vite as dev dependencies only
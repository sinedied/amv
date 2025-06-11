# amv - Quick AI Renamer

AI-powered bulk file and folder renaming tool with a simple web interface.

## Features

- 🤖 **AI-Powered**: Uses local LLM (Ollama) to suggest intelligent file names
- 🖱️ **Drag & Drop**: Easy file and folder selection
- 🌐 **Web Interface**: Clean, responsive UI that opens automatically
- 📝 **Rule-Based**: Define custom renaming rules in natural language
- 💾 **Persistent Rules**: Last used rules are saved locally
- ⚡ **Batch Operations**: Rename multiple files and folders at once
- 🚀 **One Command**: Single CLI command to start everything

## Prerequisites

- Node.js v20 or higher
- [Ollama](https://ollama.ai/) running locally with a supported model (default: `gemma2`)

## Installation

```bash
npm install -g amv
```

Or run directly from source:

```bash
git clone https://github.com/sinedied/ai-renamer.git
cd ai-renamer
npm install
npm run build
npm start
```

## Usage

### Basic Usage

```bash
amv
```

This will:
1. Start a local web server
2. Open your browser to the application
3. Display the renaming interface

### CLI Options

```bash
amv [options]

Options:
  -p, --port <port>    Port to run the server on (default: 3000)
  -m, --model <model>  AI model to use (default: gemma2)
  --no-open            Do not open browser automatically
  -h, --help           Display help for command
```

### Examples

```bash
# Use a different port
amv --port 8080

# Use a different AI model
amv --model llama3

# Start server without opening browser
amv --no-open
```

## How It Works

1. **Add Files**: Drag and drop files/folders or use the browse button
2. **Set Rules**: Define how you want files renamed (e.g., "convert to kebab-case", "add date prefix")
3. **Generate Suggestions**: Click "Generate AI Suggestions" to get AI-powered name suggestions
4. **Preview**: Review the original and suggested names in the table
5. **Rename**: Click "Rename Files" to apply the changes

## Example Renaming Rules

- "Convert to kebab-case and remove spaces"
- "Add YYYY-MM-DD date prefix to all files"
- "Convert to lowercase and replace spaces with underscores"
- "Remove special characters and use camelCase"
- "Add project prefix 'myapp-' to all files"

## Tech Stack

- **Frontend**: Lit v3 web components, modern CSS
- **Backend**: Fastify server with REST API
- **CLI**: Commander.js
- **AI**: OpenAI SDK with Ollama integration
- **Build**: Vite with TypeScript

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development mode with file watching
npm run dev

# Type check without building
npm run type-check
```

## API Endpoints

- `GET /` - Web interface
- `GET /api/health` - Health check and model info
- `POST /api/suggest-names` - Generate AI suggestions for file names
- `POST /api/rename-files` - Execute the file renaming operation

## License

MIT
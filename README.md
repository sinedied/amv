# amv - Quick AI Renamer

AI-powered bulk file and folder renaming tool with a simple web interface.

## Features

- 🤖 **AI-Powered**: Uses local LLM (Ollama), OpenAI, or Azure OpenAI to suggest intelligent file names
- 🔄 **Model Selection**: Override AI model directly from the web interface
- 🖱️ **Drag & Drop**: Easy file and folder selection
- 🌐 **Web Interface**: Clean, responsive UI that opens automatically
- 📝 **Rule-Based**: Define custom renaming rules in natural language
- 💾 **Persistent Settings**: Rules and model preferences are saved locally
- ⚡ **Batch Operations**: Rename multiple files and folders at once
- 🚀 **One Command**: Single CLI command to start everything

## Prerequisites

- Node.js v20 or higher
- One of the following AI providers:
  - [Ollama](https://ollama.ai/) running locally with a supported model (default: `ministral-3`)
  - OpenAI API key (set `OPENAI_API_KEY` environment variable)
  - Azure OpenAI endpoint and API key (set `AZURE_OPENAI_API_ENDPOINT` and `AZURE_OPENAI_API_KEY` environment variables)

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
  -m, --model <model>  AI model to use (default: ministral-3)
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

1. **Configure Settings**: Set your preferred AI model and renaming rules
2. **Add Files**: Drag and drop files/folders or use the browse button
3. **Generate Suggestions**: Click "Generate AI Suggestions" to get AI-powered name suggestions
4. **Preview**: Review the original and suggested names in the table
5. **Rename**: Click "Rename Files" to apply the changes

### Model Selection

The web interface includes an AI model field where you can specify which AI provider and model to use:
- **Default**: `ministral-3` (Ollama model, can be overridden via CLI `--model` flag)
- **Ollama**: Enter any available Ollama model name (e.g., `llama3`, `mistral`, etc.)
- **OpenAI**: Use `openai:` prefix followed by model name (e.g., `openai:gpt-4o`, `openai:gpt-4o-mini`)
- **Azure OpenAI**: Use `azure:` prefix followed by deployment name (e.g., `azure:gpt-4o`)
- **Persistence**: Your model preference is saved in browser localStorage

## AI Providers

### Ollama (Default)

No configuration required. Make sure [Ollama](https://ollama.ai/) is running locally:

```bash
# Start Ollama (if not already running)
ollama serve

# Pull a model if needed
ollama pull ministral-3
```

### OpenAI

Set the `OPENAI_API_KEY` environment variable:

```bash
# Linux/macOS
export OPENAI_API_KEY="sk-..."

# Windows (PowerShell)
$env:OPENAI_API_KEY="sk-..."

# Or use a .env file in the current directory
echo "OPENAI_API_KEY=sk-..." > .env
```

Optionally, set `OPENAI_BASE_URL` to use a custom API endpoint (e.g., for OpenAI-compatible APIs or proxies):

```bash
# Linux/macOS
export OPENAI_BASE_URL="https://api.openai.com/v1"

# Windows (PowerShell)
$env:OPENAI_BASE_URL="https://api.openai.com/v1"

# Or use a .env file
echo "OPENAI_BASE_URL=https://api.openai.com/v1" >> .env
```

Then use OpenAI models with the `openai:` prefix:

```bash
amv --model openai:gpt-4o
# or in the web interface: openai:gpt-4o-mini
```

### Azure OpenAI

Set the required environment variables:

```bash
# Linux/macOS
export AZURE_OPENAI_API_ENDPOINT="https://your-resource.openai.azure.com"
export AZURE_OPENAI_API_KEY="your-api-key"

# Windows (PowerShell)
$env:AZURE_OPENAI_API_ENDPOINT="https://your-resource.openai.azure.com"
$env:AZURE_OPENAI_API_KEY="your-api-key"

# Or use a .env file in the current directory
echo "AZURE_OPENAI_API_ENDPOINT=https://your-resource.openai.azure.com" > .env
echo "AZURE_OPENAI_API_KEY=your-api-key" >> .env
```

Then use Azure deployments with the `azure:` prefix:

```bash
amv --model azure:gpt-4o
# or in the web interface: azure:your-deployment-name
```

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
- **AI**: OpenAI SDK with support for Ollama, OpenAI, and Azure OpenAI
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

## Inspiration

This project was inspired by [BulkRenameUtility](https://github.com/XXXiaofeng/BulkRenameUtility).
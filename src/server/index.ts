import dotenv from 'dotenv';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { promises as fs } from 'node:fs';
import { OpenAI } from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in current working directory
dotenv.config();

function createOpenAIClient(model: string): OpenAI {
  if (model.startsWith('azure:')) {
    // Azure OpenAI configuration
    const endpoint = process.env.AZURE_OPENAI_API_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    
    if (!endpoint || !apiKey) {
      throw new Error('Azure OpenAI requires AZURE_OPENAI_API_ENDPOINT and AZURE_OPENAI_API_KEY environment variables');
    }
    
    const deploymentName = model.slice(6); // Remove "azure:" prefix
    console.log(`Creating Azure OpenAI client for deployment: ${deploymentName}`);
    console.log(`Endpoint: ${endpoint}`);
    
    return new OpenAI({
      baseURL: `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}`,
      apiKey,
      defaultQuery: { 'api-version': '2024-08-01-preview' },
      defaultHeaders: {
        'api-key': apiKey,
      },
    });
  } else {
    // Ollama configuration (default)
    console.log(`Creating Ollama client for model: ${model}`);
    return new OpenAI({
      baseURL: 'http://localhost:11434/v1',
      apiKey: 'ollama' // Ollama doesn't require a real API key
    });
  }
}

export interface FileItem {
  path: string;
  name: string;
  isDirectory: boolean;
  originalName: string;
  suggestedName?: string;
}

export interface RenameRequest {
  files: FileItem[];
  rules: string;
  model?: string;
}

export async function startServer(port: number, defaultModel: string) {
  const fastify = Fastify({ logger: false });

  // Serve built web assets from dist/web directory
  await fastify.register(fastifyStatic, {
    root: join(__dirname, '../web'),
    prefix: '/',
    decorateReply: false
  });

  fastify.post<{ Body: RenameRequest }>('/api/suggest-names', async (request, reply) => {
    const { files, rules, model: requestModel } = request.body;
    const model = requestModel || defaultModel;

    try {
      // Initialize OpenAI client based on model type (create per request to allow different models)
      const openai = createOpenAIClient(model);
      
      // For Azure OpenAI, we use the deployment name directly as the model
      // For Ollama, we use the model name as-is
      const actualModel = model.startsWith('azure:') ? model.slice(6) : model;
      
      console.log(`Using provider: ${model.startsWith('azure:') ? 'Azure OpenAI' : 'Ollama'}, model: ${actualModel}`);
      // For streaming results as they come, consider Fastify's reply.raw.write for future improvement
      // For now, process sequentially and return all at once
      const updatedFiles: FileItem[] = [];

      for (const file of files) {
        const prompt = `## Goal
You are a file renaming assistant. Given the following file and renaming rules, suggest a new name for the file.

## Rules
${rules}

## File to rename
${file.originalName}${file.isDirectory ? ' (directory)' : ''}

## Output format
Respond with a JSON object with a single property "suggestion", which is a string containing only the new filename or directory name (without path). Keep file extensions if they exist.

Example response format:
{ "suggestion": "new-name.txt" }`;

        let suggestedName: string | undefined;
        let lastError: Error | undefined;
        
        // Retry up to 3 times
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const isAzure = model.startsWith('azure:');
            const completionParams: any = {
              model: actualModel,
              messages: [
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
            };
            
            // Add response_format for JSON output (supported by both Azure and Ollama)
            completionParams.response_format = { type: 'json_object' };
            
            console.log(`Making API call to ${isAzure ? 'Azure OpenAI' : 'Ollama'} with model: ${actualModel}`);
            const response = await openai.chat.completions.create(completionParams);

            const content = response.choices[0]?.message?.content;
            if (!content) {
              throw new Error('No response from AI model');
            }

            let suggestion: string | undefined;
            try {
              suggestion = JSON.parse(content)?.suggestion;
            } catch (parseError) {
              console.error('Failed to parse AI response as JSON:', parseError);
              console.error('AI response content:', content);
              throw new Error(`AI model returned invalid JSON response. Please check if the model is working correctly. Response: ${content.substring(0, 100)}...`);
            }

            if (typeof suggestion !== 'string' || !suggestion.trim()) {
              throw new Error('AI did not return a valid suggestion');
            }
            
            suggestedName = suggestion;
            break; // Success, exit retry loop
          } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            console.error(`AI suggestion error for file ${file.originalName} (attempt ${attempt}/3):`, error);
            
            // If this was the last attempt, we'll throw below
            if (attempt === 3) {
              break;
            }
            
            // Wait a bit before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
        }

        // If we couldn't get a suggestion after all retries, fail the entire request
        if (!suggestedName) {
          throw new Error(`Failed to generate AI suggestion for file "${file.originalName}" after 3 attempts. Last error: ${lastError?.message || 'Unknown error'}`);
        }

        updatedFiles.push({ ...file, suggestedName });
      }

      reply.send({ files: updatedFiles });
    } catch (error) {
      console.error('AI suggestion error:', error);
      reply.status(500).send({ 
        error: 'Failed to generate suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get list of available templates
  fastify.get('/api/templates', async (request, reply) => {
    try {
      const templatesDir = join(process.cwd(), 'templates');
      const files = await fs.readdir(templatesDir);
      const templates = files
        .filter(file => file.endsWith('.md'))
        .map(file => ({
          name: file.replace('.md', ''),
          filename: file
        }));
      reply.send({ templates });
    } catch (error) {
      console.error('Error reading templates:', error);
      reply.status(500).send({ 
        error: 'Failed to load templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get template content by name
  fastify.get<{ Params: { name: string } }>('/api/templates/:name', async (request, reply) => {
    try {
      const { name } = request.params;
      const templatesDir = resolve(process.cwd(), 'templates');
      const templatePath = resolve(templatesDir, `${name}.md`);
      
      // Security: ensure the resolved path is within the templates directory
      if (!templatePath.startsWith(templatesDir + '/') && templatePath !== templatesDir) {
        reply.status(400).send({ error: 'Invalid template name' });
        return;
      }
      
      const content = await fs.readFile(templatePath, 'utf-8');
      reply.send({ content });
    } catch (error) {
      console.error('Error reading template:', error);
      reply.status(404).send({ 
        error: 'Template not found',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check
  fastify.get('/api/health', async () => {
    const azureConfigured = !!(process.env.AZURE_OPENAI_API_ENDPOINT && process.env.AZURE_OPENAI_API_KEY);
    return { 
      status: 'ok', 
      model: defaultModel,
      providers: {
        ollama: 'http://localhost:11434',
        azure: azureConfigured ? 'configured' : 'not configured'
      }
    };
  });

  // Start server
  await fastify.listen({ port, host: '0.0.0.0' });
  return fastify;
}
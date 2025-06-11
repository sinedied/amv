import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { promises as fs } from 'node:fs';
import { OpenAI } from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
}

export async function startServer(port: number, model: string) {
  const fastify = Fastify({ logger: false });

  // Serve static files from public directory
  await fastify.register(fastifyStatic, {
    root: join(__dirname, '../../public'),
    prefix: '/'
  });

  // Serve built web assets from dist/web directory
  await fastify.register(fastifyStatic, {
    root: join(__dirname, '../web'),
    prefix: '/web/',
    decorateReply: false
  });

  // Initialize OpenAI client for Ollama
  const openai = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama' // Ollama doesn't require a real API key
  });

  // API Routes
  // Instead of batching, make one AI call per file and return results as soon as all are ready
  fastify.post<{ Body: RenameRequest }>('/api/suggest-names', async (request, reply) => {
    const { files, rules } = request.body;

    try {
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

        let suggestedName = file.originalName;
        try {
          const response = await openai.chat.completions.create({
            model,
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
          });

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
        } catch (error) {
          console.error(`AI suggestion error for file ${file.originalName}:`, error);
          // Keep original name if suggestion fails
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

  fastify.post<{ Body: { files: FileItem[] } }>('/api/rename-files', async (request, reply) => {
    const { files } = request.body;

    try {
      const results = [];
      
      for (const file of files) {
        if (!file.suggestedName || file.suggestedName === file.originalName) {
          results.push({ success: false, error: 'No new name suggested', file: file.originalName });
          continue;
        }

        try {
          const oldPath = file.path;
          const newPath = join(dirname(file.path), file.suggestedName);
          
          await fs.rename(oldPath, newPath);
          results.push({ success: true, oldName: file.originalName, newName: file.suggestedName });
        } catch (error) {
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            file: file.originalName 
          });
        }
      }

      reply.send({ results });
    } catch (error) {
      console.error('Rename error:', error);
      reply.status(500).send({ 
        error: 'Failed to rename files',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Health check
  fastify.get('/api/health', async () => {
    return { status: 'ok', model };
  });

  // Start server
  await fastify.listen({ port, host: '0.0.0.0' });
  return fastify;
}
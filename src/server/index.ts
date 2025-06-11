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
  fastify.post<{ Body: RenameRequest }>('/api/suggest-names', async (request, reply) => {
    const { files, rules } = request.body;

    try {
      const prompt = `## Goal
You are a file renaming assistant. Given the following files and renaming rules, suggest new names for each file.

## Rules
${rules}

## Files to rename
${files.map((file, index) => `${index + 1}. ${file.originalName} (${file.isDirectory ? 'directory' : 'file'})`).join('\n')}

## Output format
Respond with a JSON array of suggested names in the same order as the files listed above. Each suggestion should be a string containing only the new filename/directory name (without path). Keep file extensions if they exist.

Example response format:
["new-name-1.txt", "new-name-2", "new-name-3.jpg"]`;

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI model');
      }

      // Try to parse JSON response
      let suggestions: string[];
      try {
        suggestions = JSON.parse(content);
      } catch {
        // Fallback: extract suggestions from text
        suggestions = files.map(file => file.originalName);
      }

      const updatedFiles = files.map((file, index) => ({
        ...file,
        suggestedName: suggestions[index] || file.originalName
      }));

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
import { Command } from 'commander';
import { startServer } from '../server/index.js';
import open from 'open';

export function cli(args: string[]) {
  const program = new Command();

  program
    .name('amv')
    .description('Quick AI Renamer - AI-powered bulk file and folder renaming tool')
    .version('1.0.0')
    .option('-p, --port <port>', 'Port to run the server on', '3000')
    .option('-m, --model <model>', 'AI model to use', 'gemma3')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
      const port = parseInt(options.port);
      const model = options.model;
      const shouldOpen = options.open;

      console.log('🚀 Starting amv server...');
      console.log(`📊 Using AI model: ${model}`);
      
      try {
        const server = await startServer(port, model);
        const address = server.server.address();
        const url = typeof address === 'string' ? address : `http://localhost:${port}`;
        
        console.log(`🌐 Server running at ${url}`);
        
        if (shouldOpen) {
          console.log('🔗 Opening browser...');
          await open(url);
        }
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
          console.log('\n📝 Shutting down server...');
          await server.close();
          process.exit(0);
        });
        
      } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
      }
    });

  program.parse(args, { from: 'user' });
}
import { Command } from 'commander';
import { startServer } from '../server/index.js';
import open from 'open';

async function waitForServerReady(url: string, maxAttempts = 50): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server not ready yet, continue polling
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

export function cli(args: string[]) {
  const program = new Command();

  program
    .name('amv')
    .description('Quick AI Renamer - AI-powered bulk file and folder renaming tool')
    .version('1.0.0')
    .option('-p, --port <port>', 'Port to run the server on', '4343')
    .option('-m, --model <model>', 'AI model to use (default: ministral-3, supports azure:deployment-name)', 'ministral-3')
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
          const isReady = await waitForServerReady(url);
          
          if (isReady) {
            console.log('🔗 Opening browser...');
            await open(url);
          } else {
            console.log('⚠️  Server may not be fully ready, but continuing...');
            await open(url);
          }
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
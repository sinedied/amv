import './components.js';
import type { FileItem } from './components.js';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  const fileManager = document.querySelector('file-manager');
  const fileList = document.querySelector('file-list');

  // Listen for files being added
  document.addEventListener('files-added', (e: Event) => {
    const customEvent = e as CustomEvent<FileItem[]>;
    const files = customEvent.detail;
    
    if (fileList && files) {
      (fileList as any).addFiles(files);
    }
  });

  // Check server health on load
  checkServerHealth();
});

async function checkServerHealth() {
  try {
    const response = await fetch('/api/health');
    const health = await response.json();
    console.log('Server health:', health);
  } catch (error) {
    console.error('Server health check failed:', error);
  }
}
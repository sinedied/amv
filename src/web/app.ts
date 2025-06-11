import './components.js';

// Initialize the app
function initApp() {
  const fileManager = document.querySelector('file-manager');
  const fileList = document.querySelector('file-list');

  // Listen for files being added
  document.addEventListener('files-added', (e) => {
    const customEvent = e as CustomEvent;
    const files = customEvent.detail;
    
    if (fileList && files) {
      (fileList as any).addFiles(files);
    }
  });

  // Check server health on load
  checkServerHealth();
}

async function checkServerHealth() {
  try {
    const response = await fetch('/api/health');
    const health = await response.json();
    console.log('Server health:', health);
  } catch (error) {
    console.error('Server health check failed:', error);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Ensure this module has side effects
export {};

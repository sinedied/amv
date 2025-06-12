import './index.js';

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

  // Listen for error events from file-manager
  document.addEventListener('show-error', (e) => {
    const customEvent = e as CustomEvent;
    const errorMessage = customEvent.detail;
    
    if (fileList) {
      (fileList as any).showMessage(errorMessage, 'error');
    }
  });

  // Check server health on load
  checkServerHealth();
  
  // Check File System Access API support and show error if not supported
  checkFileSystemAccessAPI();
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

function checkFileSystemAccessAPI() {
  const hasFileSystemAccess = 'showOpenFilePicker' in window && 'showDirectoryPicker' in window;
  
  if (!hasFileSystemAccess) {
    console.error('File System Access API not supported. This application requires Chrome 86+ or Edge 86+.');
    
    // Show error to users immediately
    const fileList = document.querySelector('file-list');
    if (fileList) {
      setTimeout(() => {
        (fileList as any).showMessage(
          'This application requires a modern browser with File System Access API support (Chrome 86+ or Edge 86+). Please upgrade your browser to use this tool.',
          'error'
        );
      }, 500);
    }
  } else {
    console.log('File System Access API is supported!');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Ensure this module has side effects
export {};

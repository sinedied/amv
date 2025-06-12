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

  // Check server health on load
  checkServerHealth();
  
  // Check File System Access API support
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
  const hasDragDropSupport = typeof (DataTransferItem.prototype as any).getAsFileSystemHandle === 'function';
  
  if (!hasFileSystemAccess) {
    console.warn('File System Access API not supported. Renaming functionality will be limited.');
    
    // Show a warning to users
    const fileList = document.querySelector('file-list');
    if (fileList) {
      setTimeout(() => {
        (fileList as any).showMessage(
          'Your browser does not support the File System Access API. File renaming may not work. Please use Chrome 86+ or another modern browser.',
          'error'
        );
      }, 1000);
    }
  } else {
    console.log('File System Access API is supported!');
    if (!hasDragDropSupport) {
      console.warn('Drag & drop with File System Access API is not fully supported. Use file picker buttons for best results.');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Ensure this module has side effects
export {};

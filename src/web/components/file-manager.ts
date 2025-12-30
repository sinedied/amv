import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { FileItem } from '../types.js';

// Extend interfaces for File System Access API
declare global {
  interface DataTransferItem {
    getAsFileSystemHandle?(): Promise<FileSystemHandle>;
  }
  
  interface FileSystemHandle {
    requestPermission?(options: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
  }
  
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  }
  
  interface Window {
    showOpenFilePicker?(options?: any): Promise<FileSystemFileHandle[]>;
    showDirectoryPicker?(options?: any): Promise<FileSystemDirectoryHandle>;
  }
}

@customElement('file-manager')
export class FileManager extends LitElement {

  @state()
  private dragOver = false;

  @state()
  private loadFilesInFolders = true;

  static styles = css`
    .drop-zone {
      border: 1.5px dashed var(--border);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      transition: all 0.2s;
      background: var(--background);
      min-height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .drop-zone:hover, .drop-zone.drag-over {
      border-color: var(--primary-color);
      background-color: var(--hover-overlay);
    }

    .drop-zone p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .button-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background-color: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--primary-hover);
    }

    .btn-secondary {
      background-color: var(--secondary-color);
      color: white;
    }

    .btn-secondary:hover {
      background-color: var(--secondary-hover);
    }

    .checkbox-group {
      margin-bottom: 1rem;
      text-align: left;
    }

    .checkbox-group label {
      font-size: 0.875rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .checkbox-group input[type="checkbox"] {
      margin: 0;
    }
  `;

  render() {
    return html`
      <div class="checkbox-group">
        <label>
          <input type="checkbox"
            .checked=${this.loadFilesInFolders}
            @change=${this.handleLoadFilesCheckbox}
          />
          Load files in dropped folders (not folders themselves)
        </label>
      </div>
      <div class="drop-zone ${this.dragOver ? 'drag-over' : ''}"
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
      >
        <p>Drop files or folders here, or use the buttons below</p>
        <div class="button-group">
          <button type="button" class="btn-primary" @click=${this.addFiles}>
            📄 Add Files
          </button>
          <button type="button" class="btn-secondary" @click=${this.addFolders}>
            📁 Add Folders
          </button>
        </div>
      </div>
    `;
  }

  private async addFiles() {
    try {
      if (!('showOpenFilePicker' in window)) {
        this.showUnsupportedBrowserError();
        return;
      }

      const options: any = {
        multiple: true,
        excludeAcceptAllOption: false
      };

      const fileHandles = await (window as any).showOpenFilePicker(options);
      const fileItems: FileItem[] = [];
      
      for (const fileHandle of fileHandles) {
        const file = await fileHandle.getFile();
        fileItems.push({
          path: file.name,
          name: file.name,
          isDirectory: false,
          originalName: file.name,
          handle: fileHandle
        });
      }
      
      this.dispatchFileItems(fileItems);
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.error('Error selecting files:', error);
        this.showUnsupportedBrowserError();
      }
    }
  }

  private async addFolders() {
    try {
      if (!('showDirectoryPicker' in window)) {
        this.showUnsupportedBrowserError();
        return;
      }

      const dirHandle = await (window as any).showDirectoryPicker();
      const fileItems: FileItem[] = [];
      
      if (this.loadFilesInFolders) {
        // Load all files within the directory
        const dirItems = await this.processDirectoryHandle(dirHandle);
        fileItems.push(...dirItems);
      } else {
        // Just add the directory itself
        fileItems.push({
          path: dirHandle.name,
          name: dirHandle.name,
          isDirectory: true,
          originalName: dirHandle.name,
          handle: dirHandle
        });
      }
      
      this.dispatchFileItems(fileItems);
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.error('Error selecting folder:', error);
        this.showUnsupportedBrowserError();
      }
    }
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragOver = true;
  }

  private handleDragLeave() {
    this.dragOver = false;
  }

  private async handleDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
    const dt = e.dataTransfer;
    if (!dt) return;

    const fileItems: FileItem[] = [];

    try {
      // Only use File System Access API for drag & drop
      if (dt.items && dt.items.length > 0 && typeof (DataTransferItem.prototype as any).getAsFileSystemHandle === 'function') {
        
        for (let i = 0; i < dt.items.length; i++) {
          const item = dt.items[i];
          
          if (item.kind === 'file') {
            try {
              const handle = await item.getAsFileSystemHandle?.();
              if (handle) {
                
                if (handle.kind === 'file') {
                  // Request permission for the file
                  const fileHandle = handle as FileSystemFileHandle;
                  const permission = await (fileHandle as any).requestPermission?.({ mode: 'readwrite' });
                  if (permission === 'granted') {
                    const file = await fileHandle.getFile();
                    fileItems.push({
                      path: file.name,
                      name: file.name,
                      isDirectory: false,
                      originalName: file.name,
                      handle: fileHandle
                    });
                  }
                } else if (handle.kind === 'directory' && this.loadFilesInFolders) {
                  // Request permission for the directory
                  const dirHandle = handle as FileSystemDirectoryHandle;
                  const permission = await (dirHandle as any).requestPermission?.({ mode: 'readwrite' });
                  if (permission === 'granted') {
                    const dirItems = await this.processDirectoryHandle(dirHandle);
                    fileItems.push(...dirItems);
                  }
                } else if (handle.kind === 'directory') {
                  // Just add the directory itself if not loading files in folders
                  const dirHandle = handle as FileSystemDirectoryHandle;
                  const permission = await (dirHandle as any).requestPermission?.({ mode: 'readwrite' });
                  if (permission === 'granted') {
                    fileItems.push({
                      path: dirHandle.name,
                      name: dirHandle.name,
                      isDirectory: true,
                      originalName: dirHandle.name,
                      handle: dirHandle
                    });
                  }
                }
              }
            } catch (error) {
              console.warn('Failed to get file system handle for item:', error);
              // Continue to next item
            }
          }
        }
        
        // Dispatch the items we were able to get
        if (fileItems.length > 0) {
          this.dispatchFileItems(fileItems);
        } else {
          this.showUnsupportedBrowserError();
        }
      } else {
        // File System Access API not supported
        this.showUnsupportedBrowserError();
      }
    } catch (error) {
      console.error('File System Access API drag & drop failed:', error);
      this.showUnsupportedBrowserError();
    }
  }

  // Process directory handle recursively
  private async processDirectoryHandle(dirHandle: FileSystemDirectoryHandle): Promise<FileItem[]> {
    const fileItems: FileItem[] = [];
    
    try {
      // Use async iterator for directory entries
      for await (const [name, handle] of (dirHandle as any).entries()) {
        if (handle.kind === 'file') {
          const fileHandle = handle as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          fileItems.push({
            path: `${dirHandle.name}/${file.name}`,
            name: file.name,
            isDirectory: false,
            originalName: file.name,
            handle: fileHandle
          });
        } else if (handle.kind === 'directory') {
          const subDirHandle = handle as FileSystemDirectoryHandle;
          // Add the directory itself
          fileItems.push({
            path: `${dirHandle.name}/${subDirHandle.name}`,
            name: subDirHandle.name,
            isDirectory: true,
            originalName: subDirHandle.name,
            handle: subDirHandle
          });
          
          // Recursively process subdirectory
          const subItems = await this.processDirectoryHandle(subDirHandle);
          fileItems.push(...subItems);
        }
      }
    } catch (error) {
      console.error('Error processing directory:', error);
    }
    
    return fileItems;
  }

  private handleLoadFilesCheckbox(e: Event) {
    const target = e.target as HTMLInputElement;
    this.loadFilesInFolders = target.checked;
  }

  private dispatchFileItems(fileItems: FileItem[]) {
    this.dispatchEvent(new CustomEvent('files-added', {
      detail: fileItems,
      bubbles: true
    }));
  }

  private showUnsupportedBrowserError() {
    this.dispatchEvent(new CustomEvent('show-error', {
      detail: 'This application requires a modern browser with File System Access API support (Chrome 86+ or Edge 86+). Please use a supported browser.',
      bubbles: true
    }));
  }
}
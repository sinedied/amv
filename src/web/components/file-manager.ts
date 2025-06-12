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
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      text-align: center;
      transition: all 0.2s;
      cursor: pointer;
      background: var(--background);
      min-height: 2.5em;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25em;
    }

    .drop-zone:hover, .drop-zone.drag-over {
      border-color: var(--primary-color);
      background-color: rgb(79 70 229 / 0.05);
    }

    .drop-zone p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.97em;
    }
  `;

  render() {
    return html`
      <div class="form-group" style="margin-bottom:0;text-align:left;">
        <label style="font-size:0.95em;cursor:pointer;">
          <input type="checkbox"
            .checked=${this.loadFilesInFolders}
            @change=${this.handleLoadFilesCheckbox}
            style="margin-right:0.5em;vertical-align:middle;"
          />
          Load files in dropped folders (not folders themselves)
        </label>
      </div>
      <div class="drop-zone ${this.dragOver ? 'drag-over' : ''}"
        @click=${this.handleClick}
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
      >
        <p>Drop files or folders here, or click to browse</p>
        <button type="button" class="btn-primary">Browse Files</button>
      </div>
    `;
  }

  private handleClick() {
    // Only use File System Access API - no fallback
    if ('showOpenFilePicker' in window) {
      this.handleFileSystemPicker();
    } else {
      this.showUnsupportedBrowserError();
    }
  }

  private async handleFileSystemPicker() {
    try {
      const options: any = {
        multiple: true,
        excludeAcceptAllOption: false
      };

      let handles: FileSystemHandle[];
      
      if (this.loadFilesInFolders) {
        // Pick directories
        if ('showDirectoryPicker' in window) {
          handles = [await (window as any).showDirectoryPicker()];
        } else {
          throw new Error('Directory picker not supported');
        }
      } else {
        // Pick files
        if ('showOpenFilePicker' in window) {
          handles = await (window as any).showOpenFilePicker(options);
        } else {
          throw new Error('File picker not supported');
        }
      }

      const fileItems: FileItem[] = [];
      
      for (const handle of handles) {
        if (handle.kind === 'file') {
          const fileHandle = handle as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          fileItems.push({
            path: file.name,
            name: file.name,
            isDirectory: false,
            originalName: file.name,
            handle: fileHandle
          });
        } else if (handle.kind === 'directory') {
          const dirHandle = handle as FileSystemDirectoryHandle;
          if (this.loadFilesInFolders) {
            const dirItems = await this.processDirectoryHandle(dirHandle);
            fileItems.push(...dirItems);
          } else {
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
      
      this.dispatchFileItems(fileItems);
    } catch (error) {
      console.error('Error with file system picker:', error);
      this.showUnsupportedBrowserError();
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
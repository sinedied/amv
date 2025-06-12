import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { FileItem } from '../types.js';

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

    input[type="file"] {
      display: none;
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
        <input 
          type="file" 
          multiple 
          webkitdirectory
          @change=${this.handleFileInput}
          id="fileInput"
        >
      </div>
    `;
  }

  private handleClick() {
    // Use File System Access API for file picking if available
    if ('showOpenFilePicker' in window) {
      this.handleFileSystemPicker();
    } else {
      // Fallback to traditional file input
      const input = this.shadowRoot?.getElementById('fileInput') as HTMLInputElement;
      input?.click();
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
          const file = await handle.getFile();
          fileItems.push({
            path: file.name,
            name: file.name,
            isDirectory: false,
            originalName: file.name,
            handle: handle
          });
        } else if (handle.kind === 'directory') {
          if (this.loadFilesInFolders) {
            const dirItems = await this.processDirectoryHandle(handle);
            fileItems.push(...dirItems);
          } else {
            fileItems.push({
              path: handle.name,
              name: handle.name,
              isDirectory: true,
              originalName: handle.name,
              handle: handle
            });
          }
        }
      }
      
      this.dispatchFileItems(fileItems);
    } catch (error) {
      console.error('Error with file system picker:', error);
      // User probably cancelled, or API not supported
      const input = this.shadowRoot?.getElementById('fileInput') as HTMLInputElement;
      input?.click();
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

    let useFileSystemAccess = false;
    const fileItems: FileItem[] = [];

    try {
      // Try File System Access API for drag & drop if available
      if (dt.items && dt.items.length > 0 && typeof DataTransferItem.prototype.getAsFileSystemHandle === 'function') {
        
        for (let i = 0; i < dt.items.length; i++) {
          const item = dt.items[i];
          
          if (item.kind === 'file') {
            try {
              const handle = await item.getAsFileSystemHandle();
              if (handle) {
                useFileSystemAccess = true;
                
                if (handle.kind === 'file') {
                  // Request permission for the file
                  const permission = await handle.requestPermission({ mode: 'readwrite' });
                  if (permission === 'granted') {
                    const file = await handle.getFile();
                    fileItems.push({
                      path: file.name,
                      name: file.name,
                      isDirectory: false,
                      originalName: file.name,
                      handle: handle
                    });
                  }
                } else if (handle.kind === 'directory' && this.loadFilesInFolders) {
                  // Request permission for the directory
                  const permission = await handle.requestPermission({ mode: 'readwrite' });
                  if (permission === 'granted') {
                    const dirItems = await this.processDirectoryHandle(handle);
                    fileItems.push(...dirItems);
                  }
                } else if (handle.kind === 'directory') {
                  // Just add the directory itself if not loading files in folders
                  const permission = await handle.requestPermission({ mode: 'readwrite' });
                  if (permission === 'granted') {
                    fileItems.push({
                      path: handle.name,
                      name: handle.name,
                      isDirectory: true,
                      originalName: handle.name,
                      handle: handle
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
      }
      
      // If we successfully got items with File System Access API, use them
      if (useFileSystemAccess && fileItems.length > 0) {
        this.dispatchFileItems(fileItems);
        return;
      }
    } catch (error) {
      console.warn('File System Access API drag & drop failed:', error);
    }

    // Fallback to legacy drag & drop
    console.log('Using legacy drag & drop handling');
    this.handleLegacyDrop(e);
  }

  // Process directory handle recursively
  private async processDirectoryHandle(dirHandle: FileSystemDirectoryHandle): Promise<FileItem[]> {
    const fileItems: FileItem[] = [];
    
    try {
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
          const file = await handle.getFile();
          fileItems.push({
            path: `${dirHandle.name}/${file.name}`,
            name: file.name,
            isDirectory: false,
            originalName: file.name,
            handle: handle
          });
        } else if (handle.kind === 'directory') {
          // Add the directory itself
          fileItems.push({
            path: `${dirHandle.name}/${handle.name}`,
            name: handle.name,
            isDirectory: true,
            originalName: handle.name,
            handle: handle
          });
          
          // Recursively process subdirectory
          const subItems = await this.processDirectoryHandle(handle);
          fileItems.push(...subItems);
        }
      }
    } catch (error) {
      console.error('Error processing directory:', error);
    }
    
    return fileItems;
  }

  // Fallback to legacy drag & drop
  private async handleLegacyDrop(e: DragEvent) {
    const dt = e.dataTransfer;
    if (!dt) return;

    // If the option is checked, recursively get all files in dropped folders
    if (this.loadFilesInFolders && dt.items && dt.items.length > 0) {
      const entries: any[] = [];
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i];
        if (typeof item.webkitGetAsEntry === 'function') {
          const entry = item.webkitGetAsEntry();
          if (entry) entries.push(entry);
        }
      }
      const files: File[] = await this.getFilesFromEntries(entries);
      this.processFiles(files);
    } else {
      // Fallback: just use the files array (may include folders as empty files)
      const files = Array.from(dt.files || []);
      this.processFiles(files);
    }
  }
  private async getFilesFromEntries(entries: any[]): Promise<File[]> {
    const files: File[] = [];
    for (const entry of entries) {
      if (entry.isFile) {
        files.push(await this.getFileFromEntry(entry));
      } else if (entry.isDirectory) {
        files.push(...await this.readAllFilesInDirectory(entry));
      }
    }
    return files;
  }

  private getFileFromEntry(entry: any): Promise<File> {
    return new Promise((resolve, reject) => {
      entry.file((file: File) => resolve(file), reject);
    });
  }

  private readAllFilesInDirectory(directoryEntry: any): Promise<File[]> {
    return new Promise((resolve, reject) => {
      const dirReader = directoryEntry.createReader();
      const entries: any[] = [];
      const readEntries = () => {
        dirReader.readEntries(async (results: any[]) => {
          if (!results.length) {
            // All entries read, now recurse
            const files: File[] = [];
            for (const entry of entries) {
              if (entry.isFile) {
                files.push(await this.getFileFromEntry(entry));
              } else if (entry.isDirectory) {
                files.push(...await this.readAllFilesInDirectory(entry));
              }
            }
            resolve(files);
          } else {
            entries.push(...results);
            readEntries();
          }
        }, reject);
      };
      readEntries();
    });
  }

  private handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (this.loadFilesInFolders) {
      const onlyFiles = files.filter(f => !(f.type === '' && f.size === 0));
      this.processFiles(onlyFiles);
    } else {
      this.processFiles(files);
    }
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

  private processFiles(files: File[]) {
    const fileItems: FileItem[] = files.map(file => ({
      path: file.webkitRelativePath || file.name,
      name: file.name,
      isDirectory: file.type === '' && file.size === 0,
      originalName: file.name
      // Note: no handle for legacy files - renaming won't work
    }));

    this.dispatchFileItems(fileItems);
  }
}
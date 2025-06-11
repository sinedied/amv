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
    const input = this.shadowRoot?.getElementById('fileInput') as HTMLInputElement;
    input?.click();
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

  // Recursively get all files from dropped directory entries
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

  private processFiles(files: File[]) {
    const fileItems: FileItem[] = files.map(file => ({
      path: file.webkitRelativePath || file.name,
      name: file.name,
      isDirectory: file.type === '' && file.size === 0,
      originalName: file.name
    }));

    this.dispatchEvent(new CustomEvent('files-added', {
      detail: fileItems,
      bubbles: true
    }));
  }
}
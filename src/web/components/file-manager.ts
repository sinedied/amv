import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { FileItem } from '../types.js';

@customElement('file-manager')
export class FileManager extends LitElement {
  @state()
  private dragOver = false;

  static styles = css`
    .drop-zone {
      border: 2px dashed var(--border);
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      transition: all 0.2s;
      cursor: pointer;
    }

    .drop-zone:hover, .drop-zone.drag-over {
      border-color: var(--primary-color);
      background-color: rgb(79 70 229 / 0.05);
    }

    .drop-zone p {
      margin-bottom: 1rem;
      color: var(--text-secondary);
    }

    input[type="file"] {
      display: none;
    }
  `;

  render() {
    return html`
      <div 
        class="drop-zone ${this.dragOver ? 'drag-over' : ''}"
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

  private handleDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
    
    const files = Array.from(e.dataTransfer?.files || []);
    this.processFiles(files);
  }

  private handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.processFiles(files);
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
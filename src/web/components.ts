import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

export interface FileItem {
  path: string;
  name: string;
  isDirectory: boolean;
  originalName: string;
  suggestedName?: string;
}

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

@customElement('rules-manager')
export class RulesManager extends LitElement {
  @state()
  private rules = '';

  static styles = css`
    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      resize: vertical;
      min-height: 120px;
      transition: border-color 0.2s;
    }

    textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgb(79 70 229 / 0.1);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadRules();
  }

  render() {
    return html`
      <div class="form-group">
        <label for="rules">Renaming Rules:</label>
        <textarea
          id="rules"
          .value=${this.rules}
          @input=${this.handleRulesChange}
          placeholder="Describe how you want to rename your files. For example:&#10;- Convert to kebab-case&#10;- Remove spaces and special characters&#10;- Add date prefix (YYYY-MM-DD)&#10;- Convert to lowercase"
        ></textarea>
      </div>
    `;
  }

  private handleRulesChange(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    this.rules = target.value;
    this.saveRules();
    
    this.dispatchEvent(new CustomEvent('rules-changed', {
      detail: this.rules,
      bubbles: true
    }));
  }

  private loadRules() {
    const saved = localStorage.getItem('amv-rules');
    if (saved) {
      this.rules = saved;
    }
  }

  private saveRules() {
    localStorage.setItem('amv-rules', this.rules);
  }

  getRules() {
    return this.rules;
  }
}

@customElement('file-list')
export class FileList extends LitElement {
  @state()
  private files: FileItem[] = [];

  @state()
  private isLoading = false;

  @state()
  private message = '';

  @state()
  private messageType: 'success' | 'error' | '' = '';

  static styles = css`
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      font-weight: 600;
      background-color: var(--background);
      color: var(--text-primary);
    }

    tr:hover {
      background-color: var(--background);
    }

    .button-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background-color: var(--primary-color);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: var(--primary-hover);
    }

    .btn-secondary {
      background-color: var(--secondary-color);
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #4b5563;
    }

    .btn-success {
      background-color: var(--success);
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background-color: #059669;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading {
      position: relative;
      overflow: hidden;
    }

    .loading::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: loading 1.5s infinite;
    }

    @keyframes loading {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .status-message {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .status-success {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
    }

    .status-error {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
    }
  `;

  render() {
    return html`
      ${this.message ? html`
        <div class="status-message status-${this.messageType}">
          ${this.message}
        </div>
      ` : ''}

      ${this.files.length === 0 ? html`
        <div class="empty-state">
          <p>No files added yet. Use the file manager above to add files or folders to rename.</p>
        </div>
      ` : html`
        <div class="button-group">
          <button 
            class="btn-primary ${this.isLoading ? 'loading' : ''}"
            @click=${this.generateSuggestions}
            ?disabled=${this.isLoading}
          >
            ${this.isLoading ? 'Generating...' : 'Generate AI Suggestions'}
          </button>
          <button 
            class="btn-success"
            @click=${this.renameFiles}
            ?disabled=${this.isLoading || !this.hasSuggestions()}
          >
            Rename Files
          </button>
          <button 
            class="btn-secondary"
            @click=${this.clearFiles}
            ?disabled=${this.isLoading}
          >
            Clear Files
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Original Name</th>
              <th>Suggested Name</th>
            </tr>
          </thead>
          <tbody>
            ${this.files.map(file => html`
              <tr>
                <td>${file.isDirectory ? '📁' : '📄'}</td>
                <td>${file.originalName}</td>
                <td>${file.suggestedName || '-'}</td>
              </tr>
            `)}
          </tbody>
        </table>
      `}
    `;
  }

  addFiles(newFiles: FileItem[]) {
    this.files = [...this.files, ...newFiles];
  }

  private async generateSuggestions() {
    const rulesManager = document.querySelector('rules-manager') as RulesManager;
    const rules = rulesManager?.getRules() || '';

    if (!rules.trim()) {
      this.showMessage('Please enter some renaming rules first.', 'error');
      return;
    }

    this.isLoading = true;
    this.clearMessage();

    try {
      const response = await fetch('/api/suggest-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: this.files,
          rules
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.files = result.files;
      this.showMessage('AI suggestions generated successfully!', 'success');
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      this.showMessage(`Failed to generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  private async renameFiles() {
    this.isLoading = true;
    this.clearMessage();

    try {
      const response = await fetch('/api/rename-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: this.files
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const successful = result.results.filter((r: any) => r.success).length;
      const failed = result.results.filter((r: any) => !r.success).length;

      if (failed === 0) {
        this.showMessage(`Successfully renamed ${successful} files!`, 'success');
        this.files = [];
      } else {
        this.showMessage(`Renamed ${successful} files, ${failed} failed.`, 'error');
      }
    } catch (error) {
      console.error('Failed to rename files:', error);
      this.showMessage(`Failed to rename files: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  private clearFiles() {
    this.files = [];
    this.clearMessage();
  }

  private hasSuggestions(): boolean {
    return this.files.some(file => file.suggestedName && file.suggestedName !== file.originalName);
  }

  private showMessage(message: string, type: 'success' | 'error') {
    this.message = message;
    this.messageType = type;
    setTimeout(() => this.clearMessage(), 5000);
  }

  private clearMessage() {
    this.message = '';
    this.messageType = '';
  }
}
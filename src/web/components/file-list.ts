import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { FileItem } from '../types.js';
import type { RulesManager } from './rules-manager.js';

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
      // Make one request per file for progressive updates
      const updatedFiles: FileItem[] = [...this.files];
      for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i];
        // Optionally show per-file loading state here
        try {
          const response = await fetch('/api/suggest-names', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              files: [file],
              rules
            })
          });

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
              const errorData = await response.json();
              if (errorData.error) {
                errorMessage = errorData.error;
                if (errorData.details) {
                  errorMessage += ` - ${errorData.details}`;
                }
              }
            } catch {}
            throw new Error(errorMessage);
          }

          const result = await response.json();
          // result.files is an array with one file
          updatedFiles[i] = result.files[0];
          this.files = [...updatedFiles]; // trigger UI update for progress
        } catch (error) {
          // If a single file fails, keep its original name and continue
          updatedFiles[i] = { ...file, suggestedName: file.originalName };
          this.files = [...updatedFiles];
        }
      }
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
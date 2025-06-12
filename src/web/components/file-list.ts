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
    const model = rulesManager?.getModel() || 'gemma3';

    if (!rules.trim()) {
      this.showMessage('Please enter some renaming rules first.', 'error');
      return;
    }

    this.isLoading = true;
    this.clearMessage();

    try {
      // Clear existing suggestions before generating new ones
      this.files = this.files.map(file => ({ ...file, suggestedName: undefined }));

      // Make one request per file for progressive updates
      const updatedFiles: FileItem[] = [...this.files];
      for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i];
        try {
          // Create a serializable version of the file object (exclude handle)
          const serializableFile = {
            path: file.path,
            name: file.name,
            isDirectory: file.isDirectory,
            originalName: file.originalName,
            suggestedName: file.suggestedName
          };

          const response = await fetch('/api/suggest-names', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              files: [serializableFile],
              rules,
              model
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
          // result.files is an array with one file - merge suggestion back with original file (including handle)
          updatedFiles[i] = { ...file, suggestedName: result.files[0].suggestedName };
          this.files = [...updatedFiles]; // trigger UI update for progress
        } catch (error) {
          // If a single file fails, leave the suggested name undefined and continue
          console.warn(`Failed to get suggestion for file ${file.originalName}:`, error);
          updatedFiles[i] = { ...file, suggestedName: undefined };
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
      const results = [];
      let successful = 0;
      let failed = 0;

      for (const file of this.files) {
        if (!file.suggestedName || file.suggestedName === file.originalName) {
          results.push({ success: false, error: 'No new name suggested', file: file.originalName });
          failed++;
          continue;
        }

        if (!file.handle) {
          results.push({ success: false, error: 'File System Access API required - please re-add files using drag & drop or file picker', file: file.originalName });
          failed++;
          continue;
        }

        try {
          // Use File System Access API to rename the file/directory
          const handle = file.handle;
          
          if (handle.kind === 'file') {
            // For files, get the file object first and then call move()
            const fileHandle = handle as FileSystemFileHandle;
            const fileObj = await fileHandle.getFile();
            
            // Check if the file object has the move method
            if (typeof (fileObj as any).move === 'function') {
              await (fileObj as any).move(file.suggestedName);
              results.push({ success: true, oldName: file.originalName, newName: file.suggestedName });
              successful++;
            } else {
              throw new Error('File renaming not supported: move() method is not available on File object');
            }
          } else if (handle.kind === 'directory') {
            // For directories, get the directory and then call move()
            const dirHandle = handle as FileSystemDirectoryHandle;
            
            // Check if the directory handle has the move method
            if (typeof (dirHandle as any).move === 'function') {
              await (dirHandle as any).move(file.suggestedName);
              results.push({ success: true, oldName: file.originalName, newName: file.suggestedName });
              successful++;
            } else {
              throw new Error('Directory renaming not supported: move() method is not available on directory handle');
            }
          } else {
            throw new Error('Unknown handle type');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({ 
            success: false, 
            error: errorMessage,
            file: file.originalName 
          });
          failed++;
        }
      }

      if (failed === 0) {
        this.showMessage(`Successfully renamed ${successful} files!`, 'success');
        this.files = [];
      } else if (successful > 0) {
        this.showMessage(`Renamed ${successful} files, ${failed} failed. Check console for details.`, 'error');
        console.warn('Rename failures:', results.filter(r => !r.success));
      } else {
        this.showMessage(`Failed to rename files. ${failed} operations failed.`, 'error');
        console.error('All rename operations failed:', results);
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
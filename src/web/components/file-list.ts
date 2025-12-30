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

  @state()
  private hasTriedGeneration = false;

  private abortController: AbortController | null = null;

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
      table-layout: fixed;
    }

    th, td {
      padding: 0.25rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    th {
      font-weight: 600;
      background-color: var(--background);
      color: var(--text-primary);
    }

    th:nth-child(1), td:nth-child(1) {
      width: 5%;
    }

    th:nth-child(2), td:nth-child(2) {
      width: 35%;
    }

    th:nth-child(3), td:nth-child(3) {
      width: 35%;
    }

    th:nth-child(4), td:nth-child(4) {
      width: 5%;
      text-align: center;
    }

    th:nth-child(5), td:nth-child(5) {
      width: 10%;
      text-align: center;
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

    .btn-danger {
      background-color: var(--danger);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #dc2626;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-small {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      border-radius: 4px;
    }

    .btn-retry {
      background-color: #f3f4f6;
      color: #6b7280;
      border: 1px solid #d1d5db;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .btn-retry:hover:not(:disabled) {
      background-color: #e5e7eb;
      color: #4b5563;
      border-color: #9ca3af;
    }

    .loading-text {
      color: var(--text-secondary);
      font-style: italic;
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
          ${this.isLoading ? html`
            <button 
              class="btn-danger"
              @click=${this.cancelSuggestions}
            >
              Cancel Generation
            </button>
          ` : html`
            <button 
              class="btn-primary"
              @click=${this.generateSuggestions}
            >
              Generate AI Suggestions
            </button>
          `}
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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.files.map((file, index) => html`
              <tr>
                <td>${file.isDirectory ? '📁' : '📄'}</td>
                <td>${file.originalName}</td>
                <td>
                  ${file.isRetrying ? html`
                    <span class="loading-text">Generating...</span>
                  ` : file.suggestedName || '-'}
                </td>
                <td>
                  ${file.renameStatus === 'success' ? html`<span title="Successfully renamed">✅</span>` : 
                    file.renameStatus === 'warning' ? html`<span title="Same name">⚠️</span>` :
                    file.renameStatus === 'error' ? html`<span title="${file.renameError || 'Rename failed'}">❌</span>` : ''}
                </td>
                <td>
                  ${this.hasTriedGeneration && !file.isRetrying && !this.isLoading ? html`
                    <button 
                      class="btn-retry"
                      @click=${() => this.retrySingleFile(index)}
                      title="Regenerate AI suggestion for this file"
                    >
                      🔄 ReGen
                    </button>
                  ` : ''}
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      `}
    `;
  }

  addFiles(newFiles: FileItem[]) {
    this.files = [...this.files, ...newFiles];
    this.sortFiles();
  }

  private sortFiles() {
    this.files = this.files.sort((a, b) => {
      // Sort directories first, then files
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      // Then sort alphabetically by original name (case-insensitive)
      return a.originalName.toLowerCase().localeCompare(b.originalName.toLowerCase());
    });
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
    this.hasTriedGeneration = true;
    this.clearMessage();
    
    // Create new AbortController for this operation
    this.abortController = new AbortController();

    try {
      // Clear existing suggestions and status before generating new ones
      this.files = this.files.map(file => ({ 
        ...file, 
        suggestedName: undefined,
        renameStatus: undefined,
        renameError: undefined,
        isRetrying: false
      }));
      this.sortFiles();

      // Make one request per file for progressive updates
      const updatedFiles: FileItem[] = [...this.files];
      for (let i = 0; i < this.files.length; i++) {
        // Check if operation was cancelled
        if (this.abortController.signal.aborted) {
          this.showMessage('AI suggestions generation was cancelled.', 'error');
          return;
        }

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
            }),
            signal: this.abortController.signal
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
          // Check if this was due to cancellation
          if (error instanceof Error && error.name === 'AbortError') {
            this.showMessage('AI suggestions generation was cancelled.', 'error');
            return;
          }
          // If a single file fails, leave the suggested name undefined and continue
          console.warn(`Failed to get suggestion for file ${file.originalName}:`, error);
          updatedFiles[i] = { ...file, suggestedName: undefined };
          this.files = [...updatedFiles];
        }
      }
      this.showMessage('AI suggestions generated successfully!', 'success');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.showMessage('AI suggestions generation was cancelled.', 'error');
      } else {
        console.error('Failed to generate suggestions:', error);
        this.showMessage(`Failed to generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    } finally {
      this.isLoading = false;
      this.abortController = null;
    }
  }

  private cancelSuggestions() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async retrySingleFile(fileIndex: number) {
    const rulesManager = document.querySelector('rules-manager') as RulesManager;
    const rules = rulesManager?.getRules() || '';
    const model = rulesManager?.getModel() || 'gemma3';

    if (!rules.trim()) {
      this.showMessage('Please enter some renaming rules first.', 'error');
      return;
    }

    const file = this.files[fileIndex];
    if (!file) return;

    // Set retry state for this specific file
    this.files = this.files.map((f, i) => 
      i === fileIndex ? { ...f, isRetrying: true, suggestedName: undefined, renameStatus: undefined, renameError: undefined } : f
    );

    try {
      // Create a serializable version of the file object (exclude handle)
      const serializableFile = {
        path: file.path,
        name: file.name,
        isDirectory: file.isDirectory,
        originalName: file.originalName,
        suggestedName: undefined
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
      
      // Update only this specific file
      this.files = this.files.map((f, i) => 
        i === fileIndex ? { ...f, isRetrying: false, suggestedName: result.files[0].suggestedName } : f
      );
      
      this.showMessage(`AI suggestion generated for "${file.originalName}"!`, 'success');
    } catch (error) {
      console.warn(`Failed to get suggestion for file ${file.originalName}:`, error);
      
      // Update this specific file with error state
      this.files = this.files.map((f, i) => 
        i === fileIndex ? { ...f, isRetrying: false, suggestedName: undefined } : f
      );
      
      this.showMessage(`Failed to generate suggestion for "${file.originalName}": ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }

  private async checkForCollisions(): Promise<{ hasCollisions: boolean; errors: string[]; collisionFiles: Set<string> }> {
    const errors: string[] = [];
    const collisionFiles = new Set<string>();
    const suggestedNames = new Map<string, { name: string; originalPath: string }[]>();

    // Group files by parent directory path and check for duplicates within the batch
    for (const file of this.files) {
      if (!file.suggestedName || file.suggestedName === file.originalName) {
        continue;
      }

      // Extract parent directory path
      const parentPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
      
      if (!suggestedNames.has(parentPath)) {
        suggestedNames.set(parentPath, []);
      }
      
      const filesInDirectory = suggestedNames.get(parentPath)!;
      
      // Check for duplicates within the batch
      const duplicate = filesInDirectory.find(f => f.name === file.suggestedName);
      if (duplicate) {
        collisionFiles.add(file.path);
        collisionFiles.add(duplicate.originalPath);
        errors.push(`Naming collision: "${file.originalName}" and "${duplicate.originalPath.split('/').pop()}" would both be renamed to "${file.suggestedName}"`);
      } else {
        filesInDirectory.push({ name: file.suggestedName, originalPath: file.path });
      }
    }

    // Additional check: try to detect if suggested names conflict with existing files
    // This is best-effort since File System Access API has limitations
    for (const file of this.files) {
      if (!file.suggestedName || file.suggestedName === file.originalName || collisionFiles.has(file.path)) {
        continue;
      }

      try {
        // If we have a directory handle and we're in that directory context, we could check
        // But the File System Access API doesn't provide easy parent directory access
        // We'll add this check when renaming and catch the error there
      } catch (error) {
        // Ignore errors in collision detection, let the rename operation handle them
      }
    }

    return {
      hasCollisions: errors.length > 0,
      errors,
      collisionFiles
    };
  }

  private async renameFiles() {
    this.isLoading = true;
    this.hasTriedGeneration = false; // Reset retry buttons after rename button is hit
    this.clearMessage();

    try {
      // Check for collisions and mark affected files, but continue with non-collision files
      const { hasCollisions, errors, collisionFiles } = await this.checkForCollisions();
      
      if (hasCollisions) {
        console.warn('Naming collisions detected:', errors);
      }

      const results = [];
      let successful = 0;
      let failed = 0;

      // Create a copy of files array to track updates
      const updatedFiles = [...this.files];

      for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i];
        
        // Skip files with collision errors
        if (collisionFiles.has(file.path)) {
          updatedFiles[i] = { 
            ...file, 
            renameStatus: 'error',
            renameError: 'Naming collision detected - multiple files would have the same name'
          };
          results.push({ success: false, error: 'Naming collision detected', file: file.originalName });
          failed++;
          continue;
        }
        
        if (!file.suggestedName || file.suggestedName === file.originalName) {
          updatedFiles[i] = { 
            ...file, 
            renameStatus: 'warning',
            renameError: 'No new name suggested or same as original'
          };
          results.push({ success: false, error: 'No new name suggested', file: file.originalName });
          failed++;
          continue;
        }

        if (!file.handle) {
          updatedFiles[i] = { 
            ...file, 
            renameStatus: 'error',
            renameError: 'File System Access API required - please re-add files using drag & drop or file picker'
          };
          results.push({ success: false, error: 'File System Access API required - please re-add files using drag & drop or file picker', file: file.originalName });
          failed++;
          continue;
        }

        try {
          // Use File System Access API to rename the file/directory
          const handle = file.handle;
          if (handle && typeof handle.move === 'function') {
            await handle.move(file.suggestedName);
            updatedFiles[i] = { ...file, renameStatus: 'success' };
            results.push({ success: true, oldName: file.originalName, newName: file.suggestedName });
            successful++;
          } else {
            // If move is not available, we need to use a different approach
            // This is a fallback for when the move API is not yet implemented
            throw new Error('File renaming not supported: File System Access API move() method is not available in this browser');
          }
        } catch (error) {
          let errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // Check if this is a naming collision error
          if (errorMessage.includes('already exists') || 
              errorMessage.includes('collision') || 
              errorMessage.includes('name is already in use') ||
              error instanceof DOMException && error.name === 'InvalidModificationError') {
            errorMessage = `Naming collision: A file or folder named "${file.suggestedName}" already exists`;
          }
          
          updatedFiles[i] = { 
            ...file, 
            renameStatus: 'error',
            renameError: errorMessage
          };
          results.push({
            success: false,
            error: errorMessage,
            file: file.originalName
          });
          failed++;
        }
      }

      // Update the files array with status information
      this.files = updatedFiles;
      this.sortFiles();

      const collisionCount = collisionFiles.size;
      const totalProcessed = successful + failed;
      
      if (failed === 0 && collisionCount === 0) {
        this.showMessage(`Successfully renamed ${successful} files!`, 'success');
      } else if (successful > 0) {
        const errorDetails = [];
        if (collisionCount > 0) {
          errorDetails.push(`${collisionCount} had naming collisions`);
        }
        if (failed - collisionCount > 0) {
          errorDetails.push(`${failed - collisionCount} other failures`);
        }
        this.showMessage(`Renamed ${successful} files, ${failed} failed (${errorDetails.join(', ')}). Check console for details.`, 'error');
        console.warn('Rename failures:', results.filter(r => !r.success));
        if (collisionCount > 0) {
          console.warn('Collision errors:', errors);
        }
      } else {
        this.showMessage(`Failed to rename files. ${failed} operations failed${collisionCount > 0 ? ` (${collisionCount} due to naming collisions)` : ''}.`, 'error');
        console.error('All rename operations failed:', results);
        if (collisionCount > 0) {
          console.error('Collision errors:', errors);
        }
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
    this.hasTriedGeneration = false;
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
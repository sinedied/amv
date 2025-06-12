export interface FileItem {
  path: string;
  name: string;
  isDirectory: boolean;
  originalName: string;
  suggestedName?: string;
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
  renameStatus?: 'success' | 'warning' | 'error';
  renameError?: string;
}
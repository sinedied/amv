export interface FileItem {
  path: string;
  name: string;
  isDirectory: boolean;
  originalName: string;
  suggestedName?: string;
}
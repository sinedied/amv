// Ambient type definition for File System Access API move() proposal

interface FileSystemFileHandle {
  /**
   * Non-standard: Proposed move method for renaming files (not yet in official spec)
   * https://github.com/WICG/file-system-access/issues/416
   */
  move?(newName: string): Promise<void>;
}

interface FileSystemDirectoryHandle {
  /**
   * Non-standard: Proposed move method for renaming directories (not yet in official spec)
   * https://github.com/WICG/file-system-access/issues/416
   */
  move?(newName: string): Promise<void>;
}

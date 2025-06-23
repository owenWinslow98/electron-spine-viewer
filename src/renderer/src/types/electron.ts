export interface IElectronAPI {
    selectFile: () => Promise<any>
    getFilePaths: (filePaths: string[]) => Promise<string[]>
    resolveFilesWithPaths: (paths: string[]) => Promise<any>
  }
  
  declare global {
    interface Window {
      api: IElectronAPI
    }
  }
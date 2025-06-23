export interface IElectronAPI {
    selectFile: () => Promise<any>
    getFilePaths: (filePaths: string[]) => Promise<string[]>
  }
  
  declare global {
    interface Window {
      api: IElectronAPI
    }
  }
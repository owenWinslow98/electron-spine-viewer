import { ElectronAPI } from '@electron-toolkit/preload'


declare global {
  interface SpineFileList {
    skel: { file: Uint8Array | null; path: string | null, name: string }
    json: { file: Uint8Array | null; path: string | null, name: string }
    atlas: { file: Uint8Array | null; path: string | null, name: string }
    skins: { file: Uint8Array | null; path: string | null, name: string }[]
    skelVersion: string | null
  }
  interface Window {
    electron: ElectronAPI
    api: {
      selectFile: () => Promise<SpineFileList>,
      resolveFilesWithPaths: (files: string[]) => Promise<SpineFileList>
    }
    ipc: {
      ipcRenderer: {
        answerMain: (channel: string, callback: (event: any, data: any) => any) => void
        callMain: (channel: string, data?: any) => Promise<any>
        sendToMain: (channel: string, data?: any) => void
      }
    }
  }
}
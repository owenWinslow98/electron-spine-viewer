import { ipcRenderer, webUtils } from 'electron'
import ipc from 'electron-better-ipc'

// Custom APIs for renderer
const api = {
  selectFile: () => ipcRenderer.invoke('select-file'),
  resolveFilesWithPaths: (paths: string[]) => ipcRenderer.invoke('resolve-files-with-paths', paths)
}

// Expose APIs to window
declare global {
  interface Window {
    api: typeof api
    electron: any
  }
}

// @ts-ignore
window.api = api
// @ts-ignore
window.ipc = ipc
// @ts-ignore
window.electron = { ipcRenderer, webUtils }

console.log('Preload script loaded, APIs exposed:', { api, electron: window.electron })

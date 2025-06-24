import { app, shell, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getResources } from './module/utils'
import { ipcMain as betterIpcMain } from 'electron-better-ipc'


const validFileList = (fileList: string[]): boolean => {
  const mainWindow = BrowserWindow.getAllWindows()[0]
  if(fileList.length < 2) {
    betterIpcMain.callRenderer(mainWindow, 'toast-message', 'at least two files are required.')
    return false;
  }
  if(!fileList.some(file => file.endsWith('.skel') || file.endsWith('.json'))) {
    betterIpcMain.callRenderer(mainWindow, 'toast-message', 'please select one skel(.skel) or json(.json) file.')
    return false;
  }
  if(!fileList.some(file => file.endsWith('.atlas'))) {
    betterIpcMain.callRenderer(mainWindow, 'toast-message', 'please select one atlas(.atlas) file.')
    return false;
  }
  return true;
}

function createMenu(): void {
  const openFile = async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          {
            name: '*.skel, *.json, *.atlas',
            extensions: ['skel', 'json', 'atlas']
          }
        ]
      })
      if(!validFileList(result.filePaths)) return
      const fileList = await getResources(result.filePaths, BrowserWindow.getAllWindows()[0])
      const mainWindow = BrowserWindow.getAllWindows()[0]
      if (mainWindow) {
        betterIpcMain.callRenderer(mainWindow, 'open-file', fileList)
      }
    } catch (error) {
      console.error(error)
    }
  }
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: openFile
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}


function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    title: 'Skel Viewer',
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,       // ✅ 启用 Node（直接访问 file.path）
      contextIsolation: false,
    }
  })


  // Enable file drag and drop
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  mainWindow.webContents.session.setPermissionRequestHandler((_, permission, callback) => {
    if (permission === 'fullscreen') {
      callback(true)
    } else {
      callback(false)
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()

    // Open DevTools in development mode
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: '*.skel, *.json, *.atlas',
          extensions: ['skel', 'json', 'atlas']
        }
      ]
    })
    if(!validFileList(result.filePaths)) return
    const fileList = await getResources(result.filePaths, BrowserWindow.getAllWindows()[0])
    return fileList 
  })


  ipcMain.handle('resolve-files-with-paths', async (_, paths: string[]) => {
    if(!validFileList(paths)) return []
    const fileList = await getResources(paths, BrowserWindow.getAllWindows()[0])
    return fileList
  })


  createWindow()
  createMenu()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

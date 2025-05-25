import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import { createMenu } from './menu'
import * as path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}


// フォルダパスの保存
ipcMain.handle('save-project-path', (event, folderPath) => {
  store.set('projectFolder', folderPath);
});

// フォルダパスを読み込む
ipcMain.handle('get-project-path', () => {
  return store.get('projectFolder', null); // なければ null
});


// 🔹 ファイル保存の IPC 通信
ipcMain.handle(
  'save-file',
  async (_event, { filename, content }: { filename: string; content: string }) => {
    const filePath = path.join(app.getPath('documents'), filename)

    try {
      fs.writeFileSync(filePath, content, 'utf-8')
      return { success: true, message: 'ファイルが保存されました！' }
    } catch (error) {
      return { success: false, message: (error as Error).message }
    }
  }
)

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

  createMenu()
  createWindow()

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

// レンダラープロセスとの連携
ipcMain.handle('openFile', openFile)
ipcMain.handle('saveFile', saveFile)
/**
 * 【メインプロセス】ファイルを開きます。
 * @returns {Promise<null|{textData: string, filePath: string}>}
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function openFile(): Promise<null | { filePath: string; textData: string }> {
  const win = BrowserWindow.getFocusedWindow()

  const result = await dialog.showOpenDialog(
    win,
    // どんなダイアログを出すかを指定するプロパティ
    {
      properties: ['openFile'],
      filters: [
        {
          name: 'Documents',
          // 読み込み可能な拡張子を指定
          extensions: ['txt', 'html', 'md', 'js', 'ts']
        }
      ]
    }
  )

  // [ファイル選択]ダイアログが閉じられた後の処理
  if (result.filePaths.length > 0) {
    const filePath = result.filePaths[0]

    // テキストファイルを読み込む
    const textData = fs.readFileSync(filePath, 'utf8')
    // ファイルパスとテキストデータを返却
    return {
      filePath,
      textData
    }
  }
  // ファイル選択ダイアログで何も選択しなかった場合は、nullを返しておく
  return null
}
/**
 * 【メインプロセス】ファイルを保存します。
 * @param event
 * @param {string} currentPath 現在編集中のファイルのパス
 * @param {string} textData テキストデータ
 * @returns {Promise<{filePath: string} | void>} 保存したファイルのパス
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function saveFile(event, currentPath, textData): Promise<{ filePath: string } | void> {
  let saveFilePath

  // 初期の入力エリアに設定されたテキストを保存しようとしたときは新規ファイルを作成する
  if (currentPath) {
    saveFilePath = currentPath
  } else {
    const win = BrowserWindow.getFocusedWindow()
    // 新規ファイル保存の場合はダイアログをだし、ファイル名をユーザーに決定してもらう
    const result = await dialog.showSaveDialog(
      win,
      // どんなダイアログを出すかを指定するプロパティ
      {
        properties: ['openFile'],
        filters: [
          {
            name: 'Documents',
            extensions: ['txt', 'html', 'md', 'js', 'ts']
          }
        ]
      }
    )
    // キャンセルした場合
    if (result.canceled) {
      // 処理を中断
      return
    }
    saveFilePath = result.filePath
  }

  // ファイルを保存
  fs.writeFileSync(saveFilePath, textData)

  return { filePath: saveFilePath }
}

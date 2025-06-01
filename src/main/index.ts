import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createMenu } from './menu';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';

let Store: any;

// ウィンドウを作成
function createWindow(): void {
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
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

// electron-store を初期化
async function setupStore() {
  if (!Store) {
    const module = await import('electron-store');
    Store = module.default;
  }
}

// ファイルを開く
async function openFile(): Promise<null | { filePath: string; textData: string }> {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Documents', extensions: ['txt', 'html', 'md', 'js', 'ts'] }],
  });

  if (result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const textData = fs.readFileSync(filePath, 'utf8');
    return { filePath, textData };
  }
  return null;
}

// ファイルを保存
async function saveFile(_event, currentPath: string, textData: string): Promise<{ filePath: string } | void> {
  let saveFilePath = currentPath;

  if (!saveFilePath) {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'Documents', extensions: ['txt', 'html', 'md', 'js', 'ts'] }],
    });
    if (result.canceled) return;
    saveFilePath = result.filePath;
  }

  fs.writeFileSync(saveFilePath, textData);
  return { filePath: saveFilePath };
}

// 保存先選択ダイアログを開く
ipcMain.handle('open-dialog', async () => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: '保存先の選択',
    buttonLabel: '保存',
    filters: [
      { name: 'Markdown Files', extensions: ['md'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return { filePath, canceled };
});

// プロジェクト保存先のフォルダ選択ダイアログを開く
ipcMain.handle('open-dialog-folder', async () => {
  const { filePaths, canceled} = await dialog.showOpenDialog({
    title: 'フォルダの選択',
    buttonLabel: '選択',
    properties: ['openDirectory'], // フォルダ選択を有効にする
  });
  console.log(filePaths)

  return {
    folderPath: canceled || filePaths.length === 0 ? null : filePaths[0],
    canceled,
  };
});

// 設定値の保存・読み出し用 IPC
ipcMain.handle('save-project-path', async (_event, folderPath) => {
  await setupStore();
  const store = new Store({
    name: 'setting',
    cwd: path.join(app.getPath('home'), '.lorenote'),
  });
  store.set('projectPath', folderPath);
  return true;
});

ipcMain.handle('get-project-path', async () => {
  await setupStore();
  const store = new Store({
    name: 'setting',
    cwd: path.join(app.getPath('home'), '.lorenote'),
  });
  return store.get('projectPath', null);
});

// ファイル操作 IPC
ipcMain.handle('openFile', openFile);
ipcMain.handle('saveFile', saveFile);

// アプリ初期化
async function main() {
  await app.whenReady();
  await setupStore();

  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

main();

// mac以外では全ウィンドウを閉じたらアプリ終了
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

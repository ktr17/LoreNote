import { HashRouter } from 'react-router-dom';
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

  // 先頭付近（必要であれば calculateNewOrder を追加）
  function calculateNewOrder(currentScraps, draggedIndex, targetIndex) {
    if (draggedIndex === targetIndex) return currentScraps[draggedIndex].order;

    let newOrder;
    if (targetIndex === 0) {
      newOrder = currentScraps[0].order - 1.0;
    } else if (targetIndex === currentScraps.length - 1) {
      newOrder = currentScraps[currentScraps.length - 1].order + 1.0;
    } else {
      const before = currentScraps[Math.min(targetIndex, draggedIndex) - 1].order;
      const after = currentScraps[Math.min(targetIndex, draggedIndex)].order;
      newOrder = (before + after) / 2.0;
    }

    return newOrder;
  }


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
async function saveFile(
  _event,
  currentPath: string,
  textData: string
): Promise<{ filePath: string } | void> {
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

/**
 * メモの情報を管理用JSON(scraps.json)に保存する
 */
ipcMain.handle('save-scrap-json', async (_event, data) => {
  await setupStore();

  const settingStore = new Store({
    name: 'setting',
    cwd: path.join(app.getPath('home'), '.lorenote'),
  });
  const projectPath = await settingStore.get('projectPath', null);

  const scrapsStore = new Store({
    name: 'scraps',
    cwd: projectPath,
  });

  const currentScrapsRaw = scrapsStore.get('scraps', []);
  const currentScraps = Array.isArray(currentScrapsRaw) ? currentScrapsRaw : [];

  const existingIndex = currentScraps.findIndex(scrap => scrap.id === data.id);

  if (existingIndex !== -1) {
    // 更新：同じ ID の scrap があれば上書き
    currentScraps[existingIndex] = { ...currentScraps[existingIndex], ...data };
  } else {
    // 追加：最大の order を求めて +1（整数に）
    const maxOrder = currentScraps.reduce((max, scrap) => {
      return scrap.order > max ? scrap.order : max;
    }, 0);
    data.order = Math.floor(maxOrder) + 1.0;
    currentScraps.push(data);
  }

  scrapsStore.set('scraps', currentScraps);
  return true;
});

/**
 * ファイルを開く
 */
ipcMain.handle('read-file', async(_event, filePath) => {
  console.log(filePath);
  const textData = fs.readFileSync(filePath, 'utf8');
  return textData;
});


// 既存の ipcMain.handle('update-scrap-order', ...) を差し替え
ipcMain.handle('update-scrap-order', async (_event, scraps: any[]) => {
  await setupStore();

  const settingStore = new Store({
    name: 'setting',
    cwd: path.join(app.getPath('home'), '.lorenote'),
  });
  const projectPath = await settingStore.get('projectPath', null);

  const scrapsStore = new Store({
    name: 'scraps',
    cwd: projectPath,
  });

  // 現在の scraps を取得
  const currentScrapsRaw = scrapsStore.get('scraps', []);
  const currentScraps = Array.isArray(currentScrapsRaw) ? currentScrapsRaw : [];

  // order を再計算
  const reorderedScraps = scraps.map((updatedScrap, index) => {
    const original = currentScraps.find((s) => s.id === updatedScrap.id)
    return {
      // ...original,
      // ...updatedScrap,
      id: updatedScrap.id,
      title: updatedScrap.title,
      type: updatedScrap.type ?? original?.type ?? 'text',
      order: index + 1.0 // 必要なら calculateNewOrder で精密な order を
    };
  });

  scrapsStore.set('scraps', reorderedScraps);
  return true;
});

/**
 * タイトルを更新する
 */
ipcMain.handle('update-scrap-title', async (_event, id: string, newTitle: string) => {
  await setupStore();
  const settingStore = new Store({
    name: 'setting',
    cwd: path.join(app.getPath('home'), '.lorenote'),
  });
  const projectPath = await settingStore.get('projectPath', null);

  const scrapsStore = new Store({
    name: 'scraps',
    cwd: projectPath,
  });

  const currentScrapsRaw = scrapsStore.get('scraps', []);
  const currentScraps = Array.isArray(currentScrapsRaw) ? currentScrapsRaw : [];

  const updatedScraps = currentScraps.map((scrap) =>
    scrap.id === id ? { ...scrap, title: newTitle } : scrap
  );

  scrapsStore.set('scraps', updatedScraps);
  return true;
});

/**
 * scraps.jsonから各要素のデータを取得する
 */
ipcMain.handle('load-scraps-from-json', async () => {
  await setupStore();
  const settingStore = new Store({
    name: 'setting',
    cwd: path.join(app.getPath('home'), '.lorenote'),
  });
  const projectPath = await settingStore.get('projectPath', null);

  const scrapsStore = new Store({
    name: 'scraps',
    cwd: projectPath,
  });
  return scrapsStore.get('scraps', null);
})

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

import { HashRouter } from 'react-router-dom';
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createMenu } from './menu';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/512x512.png?asset';
import { pathToFileURL } from 'url';
import { randomUUID } from 'crypto';
import type { Project } from '../types/project';

let Store: any;
let settingStore;
let scrapsStore;
let settingWindow: BrowserWindow | null = null;

const isDev = import.meta.env.MODE === 'development';
let forceQuit = false;

/**
 * ホームディレクトリに存在するsetting.jsonを管理するためのstoreを返却する
 */
async function getSettingStore(): Promise<any> {
  if (!settingStore) {
    await setupStore();
    const StoreModule = await import('electron-store');
    const Store = StoreModule.default;
    settingStore = new Store({
      name: 'setting',
      cwd: path.join(app.getPath('home'), '.lorenote'),
    });
  }
  return settingStore;
}

/**
 * ユーザ指定フォルダに格納するscraps.jsonを管理するためのstoreを返却する
 */
async function getScrapsStore(): Promise<any> {
  if (!scrapsStore) {
    const settingStore = await getSettingStore();
    const projectPath = settingStore.get('projectPath', null);

    scrapsStore = new Store({
      name: 'scraps',
      cwd: projectPath,
    });
  }
  return scrapsStore;
}

/**
 * メイン画面を生成する
 * @return mainWindow
 */
function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
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
      const before =
        currentScraps[Math.min(targetIndex, draggedIndex) - 1].order;
      const after = currentScraps[Math.min(targetIndex, draggedIndex)].order;
      newOrder = (before + after) / 2.0;
    }

    return newOrder;
  }

  mainWindow.on('ready-to-show', () => mainWindow.show());

  // macOSで×ボタンが押された時の処理を追加
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' && !forceQuit) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

/**
 * 設定画面を生成する
 * @param parentWindow 親Window
 */
function openSettingsWindow(parentWindow: BrowserWindow): void {
  settingWindow = new BrowserWindow({
    parent: parentWindow,
    width: 600,
    height: 400,
    modal: true,
    show: false, // ← ready-to-show を使うので false にしておく
    resizable: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    // 開発環境用（Vite dev server を使ってる場合）
    settingWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/setting`);
  } else {
    // 本番用（ビルド後）
    settingWindow.loadFile(path.join(__dirname, '../renderer/index.html/'));

    // ロード完了後にブラウザ内でハッシュを設定
    settingWindow.webContents.once('did-finish-load', () => {
      settingWindow.webContents.executeJavaScript(
        `window.location.hash = '#setting';`,
      );
    });
  }

  settingWindow.once('ready-to-show', () => {
    settingWindow?.show();
  });

  settingWindow.on('closed', () => {
    settingWindow = null;
  });
}

// electron-store を初期化
async function setupStore() {
  if (!Store) {
    const module = await import('electron-store');
    Store = module.default;
  }
}

/**
 * 既存のprojectPathをprojects配列に移行する
 */
async function migrateToMultipleProjects(): Promise<void> {
  const settingStore = await getSettingStore();
  const projects = settingStore.get('projects', null);

  // すでに移行済みの場合はスキップ
  if (projects) {
    return;
  }

  const oldProjectPath = settingStore.get('projectPath', null);

  if (oldProjectPath) {
    // 既存のプロジェクトパスを最初のプロジェクトとして設定
    const defaultProject: Project = {
      id: randomUUID(),
      name: 'デフォルトプロジェクト',
      path: oldProjectPath,
    };

    settingStore.set('projects', [defaultProject]);
    settingStore.set('currentProjectId', defaultProject.id);
    // 古い projectPath は削除しない（後方互換性のため残しておく）
  } else {
    // 初期状態
    settingStore.set('projects', []);
    settingStore.set('currentProjectId', null);
  }
}

// ファイルを開く
async function openFile(): Promise<null | {
  filePath: string;
  textData: string;
}> {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['txt', 'html', 'md', 'js', 'ts'] },
    ],
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
  textData: string,
): Promise<{ filePath: string } | void> {
  let saveFilePath = currentPath;

  if (!saveFilePath) {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Documents', extensions: ['txt', 'html', 'md', 'js', 'ts'] },
      ],
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
  const { filePaths, canceled } = await dialog.showOpenDialog({
    title: 'フォルダの選択',
    buttonLabel: '選択',
    properties: ['openDirectory'], // フォルダ選択を有効にする
  });
  console.log(filePaths);

  return {
    folderPath: canceled || filePaths.length === 0 ? null : filePaths[0],
    canceled,
  };
});

// 設定値の保存・読み出し用 IPC
ipcMain.handle('save-project-path', async (_event, folderPath) => {
  const settingStore = await getSettingStore();
  settingStore.set('projectPath', folderPath);
  return true;
});

/**
 * プロジェクトパスを取得する（現在選択されているプロジェクトのパス）
 */
async function getProjectPath(): Promise<string | null> {
  const settingStore = await getSettingStore();
  const currentProjectId = settingStore.get('currentProjectId', null);

  if (!currentProjectId) {
    // 後方互換性のため、古い形式もチェック
    return settingStore.get('projectPath', null);
  }

  const projects: Project[] = settingStore.get('projects', []);
  const currentProject = projects.find((p) => p.id === currentProjectId);

  return currentProject?.path ?? null;
}

/**
 * ファイルの保存間隔を保存する
 */
ipcMain.handle('save-interval-time', async (_event, intervalTime) => {
  const settingStore = await getSettingStore();
  settingStore.set('saveIntervalTime', intervalTime);
  return true;
});

/**
 * ファイルの保存間隔を取得する
 */
ipcMain.handle('get-interval-time', async () => {
  const settingStore = await getSettingStore();

  const intervalTime = settingStore.get('saveIntervalTime', null);
  return intervalTime !== null ? Number(intervalTime) : null;
});

/**
 * エディタの高さを保存する
 */
ipcMain.handle('save-editor-height', async (_event, editorHeight) => {
  const settingStore = await getSettingStore();
  if (editorHeight != null && editorHeight != undefined) {
    settingStore.set('editorHeight', editorHeight);
  }
  return true;
});
/**
 * エディタの高さを取得する
 */
ipcMain.handle('get-editor-height', async () => {
  const settingStore = await getSettingStore();
  const editorHeight = settingStore.get('editorHeight', null);

  return editorHeight !== null ? Number(editorHeight) : null;
});

/**
 * プロジェクト配下のファイル一覧を取得する
 */
ipcMain.handle('get-file-list', async () => {
  const projectPath = await getProjectPath();
  const files = await fs.promises.readdir(projectPath);
  return files;
});

/**
 * ファイルのパス一覧を取得する
 */
ipcMain.handle('get-all-file-paths', async () => {
  const projectPath = await getProjectPath();
  const files = await fs.promises.readdir(projectPath);
  const filePaths: string[] = [];
  // パスを作成する
  for (const i in files) {
    filePaths.push(projectPath + '/' + files[i]);
  }
  return filePaths;
});

/**
 * ファイルを読み込む
 */
ipcMain.handle('read-file', async (event, filePath: string) => {
  try {
    const textData = await fs.promises.readFile(filePath, 'utf-8');
    return textData;
  } catch (error) {
    console.error('ファイル読み込みエラー:', error);
    return null;
  }
});

/**
 * ファイル名を取得する
 */
ipcMain.handle('get-title', async (_event, id: string) => {
  const scrapsStore = await getScrapsStore();
  const scraps: Scrap[] = scrapsStore.get('scraps', []);
  const scrap = scraps.find((s) => s.id === id);
  return scrap?.title ?? null;
});

/**
 * ファイル名を変更する
 */
ipcMain.handle('rename', async (_event, oldPath: string, newPath: string) => {
  try {
    await fs.promises.rename(oldPath, newPath);
    return true;
  } catch (err) {
    console.error('ファイル名の変更に失敗:', err);
    return false;
  }
});

/**
 * ファイルを削除する
 */
ipcMain.handle('delete', async (_event, filePath: string) => {
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    console.error('ファイル削除失敗:', error);
    return false;
  }
});
/**
 * メモの情報を管理用JSON(scraps.json)に保存する
 */
ipcMain.handle('save-scrap-json', async (_event, data) => {
  // await setupStore();
  const settingStore = await getSettingStore();
  const projectPath = settingStore.get('projectPath', null);

  const scrapsStore = new Store({
    name: 'scraps',
    cwd: projectPath,
  });

  const currentScrapsRaw = scrapsStore.get('scraps', []);
  const currentScraps = Array.isArray(currentScrapsRaw) ? currentScrapsRaw : [];

  const existingIndex = currentScraps.findIndex(
    (scrap) => scrap.id === data.id,
  );

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

// 既存の ipcMain.handle('update-scrap-order', ...) を差し替え
ipcMain.handle('update-scrap-order', async (_event, scraps: any[]) => {
  // await setupStore();
  const settingStore = await getSettingStore();
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
    const original = currentScraps.find((s) => s.id === updatedScrap.id);
    return {
      // ...original,
      // ...updatedScrap,
      id: updatedScrap.id,
      title: updatedScrap.title,
      type: updatedScrap.type ?? original?.type ?? 'text',
      order: index + 1.0, // 必要なら calculateNewOrder で精密な order を
    };
  });

  scrapsStore.set('scraps', reorderedScraps);
  return true;
});

/**
 * タイトルを更新する
 */
ipcMain.handle(
  'update-scrap-title',
  async (_event, id: string, newTitle: string) => {
    await setupStore();
    const settingStore = await getSettingStore();
    const projectPath = await settingStore.get('projectPath', null);

    const scrapsStore = new Store({
      name: 'scraps',
      cwd: projectPath,
    });

    const currentScrapsRaw = scrapsStore.get('scraps', []);
    const currentScraps = Array.isArray(currentScrapsRaw)
      ? currentScrapsRaw
      : [];

    const updatedScraps = currentScraps.map((scrap) =>
      scrap.id === id ? { ...scrap, title: newTitle } : scrap,
    );

    scrapsStore.set('scraps', updatedScraps);
    return true;
  },
);

/**
 * scraps.jsonから各要素のデータを取得する
 */
ipcMain.handle('load-scraps-from-json', async () => {
  // await setupStore();
  const settingStore = await getSettingStore();
  const projectPath = await settingStore.get('projectPath', null);
  if (!projectPath) {
    console.warn('Project path is not set');
    return null;
  }
  const scrapsStore = new Store({
    name: 'scraps',
    cwd: projectPath,
  });

  return scrapsStore.get('scraps', null);
});

/**
 * scraps.jsonから指定したデータを削除する
 */
ipcMain.handle('delete-scrap', async (_event, targetId) => {
  const settingStore = await getSettingStore();
  const projectPath = await settingStore.get('projectPath', null);
  if (!projectPath) {
    console.warn('Project path is not set');
    return null;
  }
  const scrapsStore = new Store({
    name: 'scraps',
    cwd: projectPath,
  });
  // 既存の scraps を取得
  const scraps = scrapsStore.get('scraps', []) as any[];

  // IDが一致しないものだけ残す
  const updatedScraps = scraps.filter((scrap) => scrap.id !== targetId);
  return scrapsStore.set('scraps', updatedScraps);
});

/**
 * メインウィンドウへ更新通知
 */
ipcMain.on('editor-height-updated', (_event, height) => {
  const windows = BrowserWindow.getAllWindows();
  const mainWindow = windows.find((w) => !w.isModal());
  if (mainWindow) {
    mainWindow.webContents.send('send-height-updated', height);
  }
});

// プロジェクト管理 IPC
/**
 * プロジェクト一覧を取得する
 */
ipcMain.handle('get-projects', async () => {
  const settingStore = await getSettingStore();
  const projects: Project[] = settingStore.get('projects', []);
  return projects;
});

/**
 * プロジェクトを追加する
 */
ipcMain.handle('add-project', async (_event, name: string, path: string) => {
  const settingStore = await getSettingStore();
  const projects: Project[] = settingStore.get('projects', []);

  const newProject: Project = {
    id: randomUUID(),
    name,
    path,
  };

  projects.push(newProject);
  settingStore.set('projects', projects);

  // 最初のプロジェクトの場合は自動的に選択
  if (projects.length === 1) {
    settingStore.set('currentProjectId', newProject.id);
    // 後方互換性のため projectPath も更新
    settingStore.set('projectPath', path);
  }

  return newProject;
});

/**
 * プロジェクトを削除する
 */
ipcMain.handle('remove-project', async (_event, projectId: string) => {
  const settingStore = await getSettingStore();
  const projects: Project[] = settingStore.get('projects', []);
  const currentProjectId = settingStore.get('currentProjectId', null);

  const updatedProjects = projects.filter((p) => p.id !== projectId);
  settingStore.set('projects', updatedProjects);

  // 削除されたプロジェクトが現在選択中の場合
  if (currentProjectId === projectId) {
    if (updatedProjects.length > 0) {
      // 最初のプロジェクトを選択
      settingStore.set('currentProjectId', updatedProjects[0].id);
      settingStore.set('projectPath', updatedProjects[0].path);
    } else {
      settingStore.set('currentProjectId', null);
      settingStore.set('projectPath', null);
    }
  }

  return true;
});

/**
 * プロジェクト名を更新する
 */
ipcMain.handle(
  'update-project',
  async (_event, projectId: string, name: string) => {
    const settingStore = await getSettingStore();
    const projects: Project[] = settingStore.get('projects', []);

    const updatedProjects = projects.map((p) =>
      p.id === projectId ? { ...p, name } : p,
    );

    settingStore.set('projects', updatedProjects);
    return true;
  },
);

/**
 * 現在のプロジェクトを設定する
 */
ipcMain.handle('set-current-project', async (_event, projectId: string) => {
  const settingStore = await getSettingStore();
  const projects: Project[] = settingStore.get('projects', []);
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return false;
  }

  settingStore.set('currentProjectId', projectId);
  // 後方互換性のため projectPath も更新
  settingStore.set('projectPath', project.path);

  // scrapsStore をリセットして新しいプロジェクトのものを読み込む
  scrapsStore = null;

  return true;
});

/**
 * 現在のプロジェクトを取得する
 */
ipcMain.handle('get-current-project', async () => {
  const settingStore = await getSettingStore();
  const currentProjectId = settingStore.get('currentProjectId', null);

  if (!currentProjectId) {
    return null;
  }

  const projects: Project[] = settingStore.get('projects', []);
  const currentProject = projects.find((p) => p.id === currentProjectId);

  return currentProject ?? null;
});

// ファイル操作 IPC
ipcMain.handle('open-file', openFile);
ipcMain.handle('save-file', saveFile);
ipcMain.handle('get-project-path', getProjectPath);

// アプリ初期化
async function main() {
  await app.whenReady();
  await setupStore();
  await migrateToMultipleProjects();

  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // プロジェクトパスが空欄の場合、Markdownファイルを格納するパスの設定が必要なので、設定画面を開く
  const mainWindow = createWindow();
  createMenu(mainWindow);
  // ここで、設定ファイルを読み込んでアプリを表示する
  const projectPath = await getProjectPath();

  // プロジェクトパスが空欄の場合は、設定画面を表示する
  if (!projectPath) {
    openSettingsWindow(mainWindow);
  }

  // Cmd+Q で強制終了フラグを立てる
  app.on('before-quit', () => {
    forceQuit = true;
  });

  // ウィンドウが全て閉じられた時の処理
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' || forceQuit) {
      app.quit();
    }
  });

  // Dockアイコンクリック時にウィンドウを再表示
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      // 既存のウィンドウがあるが隠れている場合は表示
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].show();
      }
    }
  });
}

main();

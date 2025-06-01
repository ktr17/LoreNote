import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Electron公式APIの橋渡し
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  } catch (error) {
    console.error('electronAPIの公開に失敗:', error);
  }
} else {
  // 型チェック無視して直接代入（非推奨）
  window.electron = electronAPI;
}

// ファイル操作用API
const myApp = {
  /**
   * ファイルを開く
   */
  async openFile(): Promise<{ filePath: string; textData: string } | null> {
    return await ipcRenderer.invoke('openFile');
  },

  /**
   * ファイルを保存
   * @param currentPath 保存先のパス
   * @param textData テキスト内容
   */
  async saveFile(currentPath: string, textData: string): Promise<{ filePath: string } | void> {
    return await ipcRenderer.invoke('saveFile', currentPath, textData);
  }
};

// プロジェクト設定用API
const projectAPI = {
  /**
   * プロジェクトパスを保存
   */
  async saveProjectPath(path: string): Promise<boolean> {
    return await ipcRenderer.invoke('save-project-path', path);
  },

  /**
   * 保存済みプロジェクトパスを取得
   */
  async getProjectPath(): Promise<string | null> {
    return await ipcRenderer.invoke('get-project-path');
  }
};

// ダイアログ関連API
const customAPI = {
  /**
   * 保存用のファイルダイアログを開く
   */
  async openDialog(): Promise<{ filePath: string; canceled: boolean }> {
    return await ipcRenderer.invoke('open-dialog');
  },

  async openDialogFolder(): Promise<{ folderPath: string; canceld: boolean }> {
    return await ipcRenderer.invoke('open-dialog-folder');
  }
};

// 各APIをレンダラープロセスのグローバル空間に公開
contextBridge.exposeInMainWorld('myApp', myApp);
contextBridge.exposeInMainWorld('projectAPI', projectAPI);
contextBridge.exposeInMainWorld('api', customAPI);
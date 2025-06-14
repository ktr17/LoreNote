import { Scrap } from './../renderer/src/model/Scrap';
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
  },
  /**
   * メモの並び順を保存
   */
  async updateScrapOrder(scraps: any[]): Promise<boolean> {
    return await ipcRenderer.invoke('update-scrap-order', scraps);
  },
  /**
   * メモの内容を取得
   */
  async readFile(filePath: string): Promiese<string> {
    // フルパスで指定する必要がある
    return await ipcRenderer.invoke('read-file', filePath);
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
  },
  /**
   * メモの並び順等のデータを格納する
   */
  async saveScrapJson(data: Scrap): Promise<boolean> {
    return await ipcRenderer.invoke('save-scrap-json', data);
  },
  /**
   * タイトルの更新
   */
  async updateScrapTitle(id: string, newTitle: string): Promise<boolean> {
    return await ipcRenderer.invoke('update-scrap-title', id, newTitle);
  },

  /**
   * Scrapの読み込み
   */
  async loadScrapsFromJson(): Promise<Scrap[]> {
    return await ipcRenderer.invoke('load-scraps-from-json')
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

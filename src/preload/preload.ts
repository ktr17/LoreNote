import { Scrap } from './../renderer/src/model/Scrap';
import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// --- Electron公式APIの安全な公開 ---
if (process.contextIsolated) {
  try {
    // セキュリティ保護された環境で、Electron公式API（electronAPI）をグローバル公開
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  } catch (error) {
    console.error('electronAPIの公開に失敗:', error);
  }
} else {
  // セキュリティ制約がない場合は、非推奨ながら直接代入（開発用の暫定処理）
  window.electron = electronAPI;
}

// --- レンダラー向けAPIの定義と公開 ---
const api = {
  file: {
    /**
     * ファイル選択ダイアログを開き、選択されたファイルの内容を返します。
     * @returns 選択されたファイルのパスと内容。キャンセル時は null。
     */
    async open(): Promise<{ filePath: string; textData: string } | null> {
      return await ipcRenderer.invoke('open-file');
    },

    /**
     * 指定したパスにテキストデータを保存します。
     * @param currentPath 保存するファイルの絶対パス
     * @param textData 保存する文字列データ
     * @returns 保存先のファイルパス、または何も返さない（上書き時など）
     */
    async save(
      currentPath: string,
      textData: string,
    ): Promise<{ filePath: string } | void> {
      return await ipcRenderer.invoke('save-file', currentPath, textData);
    },

    /**
     * 指定したファイルパスからメモの内容を読み取ります。
     * @param filePath 読み込む対象のファイルパス（絶対パス）
     * @returns ファイル内の文字列データ
     */
    async read(filePath: string): Promise<string> {
      return await ipcRenderer.invoke('read-file', filePath);
    },
    /**
     * ファイル名を変更します。
     * @param oldPath 変更前のファイル名を含む絶対パス
     * @param newPath 変更後のファイル名を含む絶対パス
     * @returns ファイル名の変更に成功すればtrue、失敗すればfalse
     */
    async rename(oldPath: string, newPath: string): Promise<boolean> {
      return await ipcRenderer.invoke('rename', oldPath, newPath);
    },
    /**
     * ファイルを削除します。
     * @param filePath 削除対象のファイル名を含む絶対パス
     * @returns ファイル削除に成功すればtrue、失敗すればfalse
     */
    async delete(filePath: string): Promise<boolean> {
      return await ipcRenderer.invoke('delete', filePath);
    },
  },

  scrap: {
    /**
     * メモ（Scrap）の表示順を保存します。
     * @param scraps 並び順を反映したScrapの配列
     * @returns 保存が成功すればtrue、失敗すればfalse
     */
    async updateOrder(scraps: any[]): Promise<boolean> {
      return await ipcRenderer.invoke('update-scrap-order', scraps);
    },

    /**
     * 指定されたScrapのタイトルを更新します。
     * @param id 更新対象のScrapのID
     * @param newTitle 新しいタイトル
     * @returns 更新成功時はtrue
     */
    async updateTitle(id: string, newTitle: string): Promise<boolean> {
      return await ipcRenderer.invoke('update-scrap-title', id, newTitle);
    },

    /**
     * Scrapの状態をJSON形式で保存します。
     * @param data Scrapデータ（順序などを含む）
     * @returns 保存の成否をbooleanで返す
     */
    async saveJson(data: Scrap): Promise<boolean> {
      return await ipcRenderer.invoke('save-scrap-json', data);
    },

    /**
     * 保存されたJSONファイルからScrapデータを読み込みます。
     * @returns 読み込まれたScrapオブジェクトの配列
     */
    async loadJson(): Promise<Scrap[]> {
      return await ipcRenderer.invoke('load-scraps-from-json');
    },
    /**
     * UUIDからtitleを取り出します。
     * @params uuid
     * @returns scraps.jsonに記載されているtitle
     */
    async getTitle(id: string): Promise<string> {
      return await ipcRenderer.invoke('get-title', id);
    },
    /**
     * scraps.jsonからメモを削除します。
     * @params id
     * @return 削除が成功 true、失敗 false
     */
    async deleteScrap(id: string): Promise<boolean> {
      return await ipcRenderer.invoke('delete-scrap', id);
    },
  },

  project: {
    /**
     * プロジェクトフォルダのパスを保存します。
     * @param path 選択されたプロジェクトディレクトリのパス
     * @returns 保存の成否（boolean）
     */
    async savePath(path: string): Promise<boolean> {
      return await ipcRenderer.invoke('save-project-path', path);
    },

    /**
     * ファイルの自動保存間隔を設定します。
     * @param intervalTime 保存間隔（秒を想定）
     * @returns 設定成功時はtrue
     */
    async saveInterval(intervalTime: string): Promise<boolean> {
      return await ipcRenderer.invoke('save-interval-time', intervalTime);
    },

    /**
     * 現在設定されているファイルの保存間隔を取得します。
     * @returns 保存間隔（秒）。未設定時はnull。
     */
    async getInterval(): Promise<number | null> {
      return await ipcRenderer.invoke('get-interval-time');
    },

    /**
     * 保存済みのプロジェクトパスを取得します。
     * @returns プロジェクトのルートパス。存在しない場合はnull。
     */
    async getPath(): Promise<string | null> {
      return await ipcRenderer.invoke('get-project-path');
    },
  },

  dialog: {
    /**
     * ファイル保存用のダイアログを開き、ユーザーが指定したパスを取得します。
     * @returns ユーザーが選択したパスと、キャンセルされたかどうかのフラグ
     */
    async openFile(): Promise<{ filePath: string; canceled: boolean }> {
      return await ipcRenderer.invoke('open-dialog');
    },

    /**
     * フォルダ選択ダイアログを開きます。
     * @returns ユーザーが選択したフォルダのパスとキャンセル状態
     */
    async openFolder(): Promise<{ folderPath: string; canceld: boolean }> {
      return await ipcRenderer.invoke('open-dialog-folder');
    },
  },
};

// グローバルな `api` 名前空間として、各種機能をレンダラープロセスに公開
contextBridge.exposeInMainWorld('api', api);

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// electron-store
contextBridge.exposeInMainWorld('projectAPI', {
  saveProjectPath: (path) => ipcRenderer.invoke('save-project-path', path),
  getProjectPath: () => ipcRenderer.invoke('get-project-path'),
});

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

// preloadファイル
// レンダラープロセスのグローバル空間(window)にAPIとしての関数を生やします。
// レンダラープロセスとメインプロセスの橋渡しを行います。
contextBridge.exposeInMainWorld('myApp', {
  /**
   * 【プリロード（中継）】ファイルを開きます。
   * @returns {Promise<{filePath: string, textData:string}>}
   */
  async openFile() {
    // メインプロセスの関数を呼び出す
    const result = await ipcRenderer.invoke('openFile')
    return result
  },
  /**
   * 【プリロード（中継）】ファイルを保存します。
   * @param {string} currentPath 現在編集中のファイルのパス
   * @param {string} textData テキストデータ
   * @returns {Promise<{filePath: string} | void>}
   */
  async saveFile(currentPath, textData) {
    // メインプロセスの関数を呼び出す
    const result = await ipcRenderer.invoke('saveFile', currentPath, textData)
    return result
  }
})

import { defineConfig } from 'vitest/config';
import { Menu, MenuItemConstructorOptions, BrowserWindow } from 'electron';
import * as path from 'path';

let settingWindow: BrowserWindow | null = null;
const isDev = import.meta.env.MODE === 'development';

export function createMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: 'LoreNote',
            submenu: [
              { label: 'LoreNoteについて', role: 'about' },
              { type: 'separator' },
              {
                label: '設定',
                click: async (): Promise<void> => {
                  if (settingWindow) {
                    settingWindow.focus();
                    return;
                  }

                  settingWindow = new BrowserWindow({
                    width: 600,
                    height: 400,
                    modal: true,
                    show: false,
                    webPreferences: {
                      preload: path.join(__dirname, '../preload/preload.js'),
                      nodeIntegration: true,
                      contextIsolation: true,
                      sandbox: false,
                    },
                  });
                  if (isDev) {
                    settingWindow.loadURL('http://localhost:5173/#setting');
                  } else {
                    settingWindow.loadFile(
                      path.join(__dirname, '../renderer/index.html/'),
                    );

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
                },
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: '非表示' },
              { role: 'hideOthers', label: 'ほかを隠す' },
              { role: 'unhide', label: 'すべて表示' },
              { type: 'separator' },
              { role: 'quit', label: '終了' },
            ],
          },
        ]
      : []),
    {
      label: 'ファイル',
      submenu: [
        isMac
          ? { role: 'close', label: '閉じる' }
          : { role: 'quit', label: '終了' },
      ],
    },
    {
      label: '編集',
      submenu: [
        { role: 'undo', label: '元に戻す' },
        { role: 'redo', label: 'やり直す' },
        { type: 'separator' },
        { role: 'cut', label: '切り取り' },
        { role: 'copy', label: 'コピー' },
        { role: 'paste', label: '貼り付け' },
      ],
    },
    // { role: 'viewMenu' }
    // {
    //   label: '表示',
    //   submenu: [
    //     { role: 'reload' },
    //     { role: 'forceReload' },
    //     { role: 'toggleDevTools' },
    //     { type: 'separator' },
    //     { role: 'resetZoom' },
    //     { role: 'zoomIn' },
    //     { role: 'zoomOut' },
    //     { type: 'separator' },
    //     { role: 'togglefullscreen' },
    //   ],
    // },
    // { role: 'windowMenu' }
    {
      label: 'ウィンドウ',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: '拡大縮小' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front', label: '前面に表示' },
              //       { type: 'separator' },
              //       { role: 'window' },
            ]
          : [{ role: 'close' }]),
        { type: 'separator' },
        { label: '開発者モード', role: 'toggleDevTools' }, // 開発者ツールをトグル
      ],
    },
    // {
    //   role: 'help',
    //   submenu: [
    //     {
    //       label: 'Learn More',
    //       click: async (): Promise<void> => {
    //         await (
    //           await import('electron')
    //         ).shell.openExternal('https://electronjs.org');
    //       },
    //     },
    //   ],
    // },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

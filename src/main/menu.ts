import { defineConfig } from 'vitest/config';
import { Menu, MenuItemConstructorOptions, BrowserWindow } from 'electron';
import * as path from 'path';

let settingWindow: BrowserWindow | null = null;
const isDev = import.meta.env.MODE === 'development';

export function createMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: 'LoreNote',
            submenu: [
              { role: 'about' },
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
                    // parent: BrowserWindow.getFocusedWindow(),
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
                    console.log('閉じるボタンを押しました。');
                    settingWindow = null;
                  });
                },
              },
              // { type: 'separator' },
              // { role: 'services' },
              // { type: 'separator' },
              // { role: 'hide' },
              // { role: 'hideOthers' },
              // { role: 'unhide' },
              // { type: 'separator' },
              // { role: 'quit' },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    // {
    //   label: 'ファイル',
    //   submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    // },
    // { role: 'editMenu' }
    // {
    //   label: '編集',
    //   submenu: [
    //     { role: 'undo' },
    //     { role: 'redo' },
    //     { type: 'separator' },
    //     { role: 'cut' },
    //     { role: 'copy' },
    //     { role: 'paste' },
    //     ...(isMac
    //       ? [
    //           { role: 'pasteAndMatchStyle' },
    //           { role: 'delete' },
    //           { role: 'selectAll' },
    //           { type: 'separator' },
    //           {
    //             label: 'Speech',
    //             submenu: [
    //               {
    //                 role: 'startSpeaking',
    //               },
    //               {
    //                 role: 'stopSpeaking',
    //               },
    //             ],
    //           },
    //         ]
    //       : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
    //   ],
    // },
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
        { label: '開発者モード', role: 'toggleDevTools' }, // 開発者ツールをトグル
        // { role: 'minimize' },
        // { role: 'zoom' },
        // ...(isMac
        //   ? [
        //       { type: 'separator' },
        //       { role: 'front' },
        //       { type: 'separator' },
        //       { role: 'window' },
        //     ]
        //   : [{ role: 'close' }]),
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

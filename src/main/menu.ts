import { defineConfig } from 'vitest/config';
import { Menu, MenuItemConstructorOptions, BrowserWindow } from 'electron';
import * as path from 'path';

const isDev = import.meta.env.MODE === 'development';

function createMenuTemplate(
  mainWindow: BrowserWindow,
): MenuItemConstructorOptions[] {
  const isMac = process.platform === 'darwin';

  const macAppMenu: MenuItemConstructorOptions = {
    label: 'LoreNote',
    submenu: [
      { label: 'LoreNoteについて', role: 'about' },
      { type: 'separator' },
      {
        label: '設定',
        accelerator: 'CmdOrCtrl+,', // macOSでは Cmd+, になる
        click: (): void => {
          mainWindow.webContents.send('navigate-to-setting');
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
  };

  const fileMenu: MenuItemConstructorOptions = {
    label: 'ファイル',
    submenu: [
      isMac
        ? { role: 'close', label: '閉じる' }
        : { role: 'quit', label: '終了' },
    ],
  };

  const editMenu: MenuItemConstructorOptions = {
    label: '編集',
    submenu: [
      { role: 'undo', label: '元に戻す' },
      { role: 'redo', label: 'やり直す' },
      { type: 'separator' },
      { role: 'cut', label: '切り取り' },
      { role: 'copy', label: 'コピー' },
      { role: 'paste', label: '貼り付け' },
    ],
  };

  const windowMenu: MenuItemConstructorOptions = {
    label: 'ウィンドウ',
    submenu: [
      { role: 'minimize', label: '最小化' },
      { role: 'zoom', label: '拡大縮小' },
      ...(isMac
        ? [
            { type: 'separator' } as MenuItemConstructorOptions,
            {
              role: 'front',
              label: '前面に表示',
            } as MenuItemConstructorOptions,
          ]
        : [{ role: 'close' } as MenuItemConstructorOptions]),
      { type: 'separator' },
      { label: '開発者モード', role: 'toggleDevTools' },
    ],
  };

  return [...(isMac ? [macAppMenu] : []), fileMenu, editMenu, windowMenu];
}

export function createMenu(mainWindow: BrowserWindow): void {
  const template = createMenuTemplate(mainWindow);
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

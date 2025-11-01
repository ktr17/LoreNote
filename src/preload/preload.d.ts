// src/preload/preload.d.ts
import { Scrap } from './../renderer/src/model/Scrap';
import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      file: {
        open(): Promise<{ filePath: string; textData: string } | null>;
        save(
          currentPath: string,
          textData: string,
        ): Promise<{ filePath: string } | void>;
        read(filePath: string): Promise<string>;
        rename(oldPath: string, newPath: string): Promise<boolean>;
        delete(filePath: string): Promise<boolean>;
      };
      scrap: {
        updateOrder(scraps: any[]): Promise<boolean>;
        updateTitle(id: string, newTitle: string): Promise<boolean>;
        saveJson(data: Scrap): Promise<boolean>;
        loadJson(): Promise<Scrap[]>;
        getTitle(id: string): Promise<string>;
        deleteScrap(id: string): Promise<boolean>;
      };
      project: {
        savePath(path: string): Promise<boolean>;
        saveInterval(intervalTime: number): Promise<boolean>;
        saveEditorHeight(editorHeight: number): Promise<boolean>;
        getInterval(): Promise<number | null>;
        getPath(): Promise<string | null>;
        getEditorHeight(): Promise<number | null>;
        notifyEditorHeight(height: number): void;
        onEditorHeightUpdated(callback: (height: number) => void): void;
        offEditorHeightUpdated(callback: (height: number) => void): void;
        onHeightUpdated(callback: (height: number) => void): void;
        offHeightUpdated(callback: (height: number) => void): void;
      };
      navigation: {
        onNavigateToSetting(callback: () => void): void;
        offNavigateToSettingListener(): void;
      };
      dialog: {
        openFile(): Promise<{ filePath: string; canceled: boolean }>;
        openFolder(): Promise<{ folderPath: string; canceled: boolean }>;
      };
    };
  }
}

export {};

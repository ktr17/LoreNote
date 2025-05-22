//import { app, dialog } from '@electron/remote';
import fs from 'fs/promises';
import path from 'path';

// プロジェクトディレクトリのパスを保持する変数
let projectDirectory: string | null = null;

// アプリ起動時にプロジェクトディレクトリを作成または選択する関数
export async function initializeProject(): Promise<void> {
  // ローカルストレージからプロジェクトディレクトリを読み込む処理（後で実装）
  // 例：projectDirectory = localStorage.getItem('projectDirectory');

  if (!projectDirectory) {
    projectDirectory = await selectProjectDirectory();
    // 選択されたディレクトリをローカルストレージに保存する処理（後で実装）
    // 例：localStorage.setItem('projectDirectory', projectDirectory);
  }
}

// プロジェクトディレクトリを選択する関数
async function selectProjectDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    message: 'プロジェクトを保存するフォルダを選択してください',
  });

  if (result.canceled) {
    // フォルダ選択がキャンセルされた場合、アプリを終了するか、デフォルトの場所を使用する
    console.log('フォルダ選択がキャンセルされました');
    return null; // またはデフォルトのディレクトリを返す
  } else {
    const selectedPath = result.filePaths[0];
    console.log('選択されたフォルダ:', selectedPath);
    return selectedPath;
  }
}

// Scrapをファイルに保存する関数
export async function saveScrapToFile(id: number, content: string, title: string): Promise<void> {
  if (!projectDirectory) {
    projectDirectory = await selectProjectDirectory();
    if (!projectDirectory) {
      throw new Error('プロジェクトディレクトリが選択されていません');
    }
  }

  // ファイル名を生成（日本語対応）
  const fileName = `${title}.md`;
  // ファイルパスを生成
  const filePath = path.join(projectDirectory, fileName);

  try {
    // ファイルを保存
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`ファイルが保存されました: ${filePath}`);
  } catch (error) {
    console.error(`ファイル保存エラー: ${error}`);
    throw error;
  }
}

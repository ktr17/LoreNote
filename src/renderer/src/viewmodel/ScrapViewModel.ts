import { useState, useCallback, useEffect } from "react";
import ScrapModel from '../model/ScrapModel'

/**
 * スクラップの状態管理を行うカスタムフック
 * スクラップの追加・削除・更新・並び替えなどを提供する
 */
export const useScrapViewModel = (): {
  scraps: ScrapModel[];
  selectedScrapId: number;
  setSelectedScrapId: (id: number) => void;
  addScrap: () => number;
  updateScrapContent: (id: number, newContent: string) => void;
  updateScrapTitle: (id: number, newTitle: string) => void;
  reorderScraps: (sourceIndex: number, destinationIndex: number) => void;
  deleteScrap: (id: number) => void;
  getSelectedScrap: () => ScrapModel | null;
  addScrapFromFile: (filePaths: string[]) => Promise<void | null>;
  openProjectFiles: () => Promise<void>;
} => {
  // 初回レンダリング時にファイルを開く
  useEffect(() => {
    console.log('🔥 useEffect - openProjectFiles called');
    openProjectFiles();
  }, []);

  // 初期スクラップの状態を定義（StrictModeでも1度のみ生成される）
  const [scraps, setScraps] = useState<ScrapModel[]>(() => [
    new ScrapModel(1, '# 新しいメモ\n\nここに内容を入力してください。', '新しいメモ', 0)
  ]);

  // 現在選択中のスクラップID
  const [selectedScrapId, setSelectedScrapId] = useState<number>(1);

  /**
   * スクラップを追加
   * @returns 追加されたスクラップのID
   */
  const addScrap = useCallback(() => {
    const newId = scraps.length > 0 ? Math.max(...scraps.map((s) => s.id)) + 1 : 1;
    const newOrder = scraps.length;
    const newScrap = new ScrapModel(
      newId,
      '# 新しいメモ\n\nここに内容を入力してください。',
      '新しいメモ ' + newId,
      newOrder
    );
    setScraps([...scraps, newScrap]);
    setSelectedScrapId(newId);
    return newId;
  }, [scraps]);

  /**
   * スクラップの内容を更新
   * @param id スクラップID
   * @param newContent 更新後の内容
   */
  const updateScrapContent = useCallback((id: number, newContent: string) => {
    setScraps(prev =>
      prev.map(scrap =>
        scrap.id === id
          ? new ScrapModel(scrap.id, newContent, scrap.getTitle(), scrap.getOrder())
          : scrap
      )
    );
  }, []);

  /**
   * スクラップのタイトルを更新
   * @param id スクラップID
   * @param newTitle 新しいタイトル
   */
  const updateScrapTitle = useCallback((id: number, newTitle: string) => {
    setScraps(prev =>
      prev.map(scrap =>
        scrap.id === id
          ? new ScrapModel(scrap.id, scrap.getContent(), newTitle, scrap.getOrder())
          : scrap
      )
    );
  }, []);

  /**
   * スクラップの順序を変更
   * @param sourceIndex 元のインデックス
   * @param destinationIndex 移動先のインデックス
   */
  const reorderScraps = useCallback((sourceIndex: number, destinationIndex: number) => {
    if (sourceIndex === destinationIndex) return;
    setScraps(prev => {
      const result = [...prev];
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);
      return result.map((scrap, index) =>
        new ScrapModel(scrap.id, scrap.getContent(), scrap.getTitle(), index)
      );
    });
  }, []);

  /**
   * スクラップを削除
   * @param id 削除対象のスクラップID
   */
  const deleteScrap = useCallback((id: number) => {
    setScraps(prev => {
      const filtered = prev.filter(scrap => scrap.id !== id);
      if (filtered.length > 0 && id === selectedScrapId) {
        setSelectedScrapId(filtered[0].id);
      }
      return filtered.map((scrap, index) =>
        new ScrapModel(scrap.id, scrap.getContent(), scrap.getTitle(), index)
      );
    });
  }, [selectedScrapId]);

  /**
   * 選択中のスクラップを取得
   * @returns ScrapModel | null
   */
  const getSelectedScrap = useCallback(() => {
    return scraps.find(scrap => scrap.id === selectedScrapId) || null;
  }, [scraps, selectedScrapId]);

  /**
   * ソート済みのスクラップ一覧を取得
   * @returns ScrapModel[]
   */
  const getAllScraps = useCallback(() => {
    return [...scraps].sort((a, b) => a.getOrder() - b.getOrder());
  }, [scraps]);

  /**
   * コンテンツからh1タグのタイトルを抽出
   * @param content テキスト内容
   * @returns タイトル文字列 | null
   */
  const extractTitleFromContent = (content: string): string | null => {
    const match = content.match(/^#\s*(.+)$/m);
    return match ? match[1].trim() : null;
  };

  /**
   * 指定ファイル群からスクラップを作成・追加
   * @param filePaths ファイルパスの配列
   */
  const addScrapFromFile = useCallback(async (filePaths: string[]) => {
    try {
      const newScraps = await Promise.all(filePaths.map(async (filePath) => {
        const content = await window.myApp.readFile(filePath);
        const title = extractTitleFromContent(content) || '読み込みメモ';
        return { content, title };
      }));

      setScraps(prev => {
        const maxId = prev.length > 0 ? Math.max(...prev.map(s => s.id)) : 0;
        const updatedScraps = [...prev];

        newScraps.forEach((scrapData, index) => {
          const newId = maxId + index + 1;
          const newOrder = updatedScraps.length;
          updatedScraps.push(new ScrapModel(
            newId,
            scrapData.content,
            scrapData.title + ' ' + newId,
            newOrder
          ));
          setSelectedScrapId(newId);
        });

        return updatedScraps;
      });
    } catch (error) {
      console.error('ファイル読み込みに失敗:', error);
      alert('ファイルの読み込みに失敗しました');
      return null;
    }
  }, []);

  /**
   * プロジェクト内の全ファイルパスを取得
   * @returns ファイルパス配列
   */
  const getAllFilePaths = useCallback(async () => {
    const filePaths = await window.myApp.getAllFilePaths();
    return filePaths;
  }, []);

  /**
   * プロジェクトファイルを読み込みスクラップとして追加
   */
  const openProjectFiles = useCallback(async () => {
    console.log('📁 openProjectFiles running');
    const filePaths = await getAllFilePaths();
    await addScrapFromFile(filePaths);
  }, [getAllFilePaths, addScrapFromFile]);

  return {
    scraps: getAllScraps(),
    selectedScrapId,
    setSelectedScrapId,
    addScrap,
    updateScrapContent,
    updateScrapTitle,
    reorderScraps,
    deleteScrap,
    getSelectedScrap,
    addScrapFromFile,
    openProjectFiles
  };
};

export default useScrapViewModel;

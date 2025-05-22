import { useState, useCallback } from "react";
import ScrapModel from '../model/ScrapModel'

// スクラップ管理用のViewModel
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
} => {
  // 複数のスクラップモデルを管理
  const [scraps, setScraps] = useState<ScrapModel[]>([
    new ScrapModel(1, '# 新しいメモ\n\nここに内容を入力してください。', '新しいメモ', 0)
  ]);

  // 現在選択されているスクラップのID
  const [selectedScrapId, setSelectedScrapId] = useState<number>(1);

  // 新しいスクラップを追加
  const addScrap = useCallback(() => {
    const newId = scraps.length > 0 ? Math.max(...scraps.map((s) => s.id)) + 1 : 1
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

  // スクラップの内容を更新
  const updateScrapContent = useCallback((id: number, newContent: string) => {
    setScraps(prevScraps =>
      prevScraps.map(scrap =>
        scrap.id === id
          ? new ScrapModel(scrap.id, newContent, scrap.getTitle(), scrap.getOrder())
          : scrap
      )
    );
  }, []);

  // スクラップのタイトルを更新
  const updateScrapTitle = useCallback((id: number, newTitle: string) => {
    setScraps(prevScraps => 
      prevScraps.map(scrap => {
        if (scrap.id === id) {
          const updatedScrap = new ScrapModel(
            scrap.id, 
            scrap.getContent(), 
            newTitle, 
            scrap.getOrder()
          );
          return updatedScrap;
        }
        return scrap;
      })
    );
  }, []);

  // スクラップの順序を変更
  const reorderScraps = useCallback((sourceIndex: number, destinationIndex: number) => {
    if (sourceIndex === destinationIndex) return;

    setScraps(prevScraps => {
      const result = [...prevScraps];
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);

      // 順序を更新
      return result.map((scrap, index) => {
        const updatedScrap = new ScrapModel(scrap.id, scrap.getContent(), scrap.getTitle(), index)
        return updatedScrap;
      });
    });
  }, []);

  // スクラップを削除
  const deleteScrap = useCallback(
    (id: number) => {
      setScraps((prevScraps) => {
        const filteredScraps = prevScraps.filter((scrap) => scrap.id !== id)

        // 削除後に残ったスクラップがある場合、最初のスクラップを選択
        if (filteredScraps.length > 0 && id === selectedScrapId) {
          setSelectedScrapId(filteredScraps[0].id)
        }

        // 順序を更新
      return filteredScraps.map((scrap, index) => {
          const updatedScrap = new ScrapModel(scrap.id, scrap.getContent(), scrap.getTitle(), index)
          return updatedScrap
        })
      })
    },
    [selectedScrapId]
  )

  // 選択されたスクラップを取得
  const getSelectedScrap = useCallback(() => {
    return scraps.find((scrap) => scrap.id === selectedScrapId) || null
  }, [scraps, selectedScrapId]);

  // 全てのスクラップを順序通りに取得
  const getAllScraps = useCallback(() => {
    return [...scraps].sort((a, b) => a.getOrder() - b.getOrder());
  }, [scraps]);

  return {
    scraps: getAllScraps(),
    selectedScrapId,
    setSelectedScrapId,
    addScrap,
    updateScrapContent,
    updateScrapTitle,
    reorderScraps,
    deleteScrap,
    getSelectedScrap
  };
};

export default useScrapViewModel;

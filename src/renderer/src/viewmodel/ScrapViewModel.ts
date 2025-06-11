import { useState, useCallback, useEffect } from 'react';
import ScrapModel from '../model/ScrapModel';
import { generateScrap } from '../utils/ScrapUtils';

/**
 * メモの並び順等のデータを格納する
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
} => {
  const [scraps, setScraps] = useState<ScrapModel[]>([]);
  const [selectedScrapId, setSelectedScrapId] = useState<number>(0);

  /**
   * 初期化処理：scraps.json + mdファイル読み込み
   */
  useEffect(() => {
    const loadScraps = async () => {
      try {
        const jsonScraps = await window.projectAPI.loadScrapsFromJson();

        const loadedScraps = await Promise.all(
          jsonScraps.map(async (item: any) => {
            const fileName = `${item.title}.md`;
            const filePath = await window.projectAPI.getProjectPath();
            const content = await window.myApp.readFile(filePath + '/' + fileName);
            const title = item.title;

            return new ScrapModel({
              id: item.id,
              title,
              order: item.order,
              content,
              type: item.type
            });
          })
        );

        loadedScraps.sort((a, b) => a.getOrder() - b.getOrder());

        setScraps(loadedScraps);
        if (loadedScraps.length > 0) {
          setSelectedScrapId(loadedScraps[0].id);
        }
      } catch (e) {
        console.error('初期化失敗:', e);
      }
    };

    loadScraps();
  }, []);

  /**
   * メモの追加
   */
  const addScrap = useCallback(() => {
    const newOrder = scraps.length;
    const newScrap = new ScrapModel({
      content: '# 新しいメモ\n\nここに内容を入力してください。',
      title: '新しいメモ',
      order: newOrder
    });

    setScraps([...scraps, newScrap]);
    setSelectedScrapId(newScrap.id);

    const scrapData = generateScrap(newScrap.id, newScrap.title, 'file', newOrder);
    window.projectAPI.saveScrapJson(scrapData);

    return newScrap.id;
  }, [scraps]);

  /**
   * メモ内容の更新
   */
  const updateScrapContent = useCallback((id: number, newContent: string) => {
    setScraps(prevScraps =>
      prevScraps.map(scrap =>
        scrap.id === id
          ? new ScrapModel({
              content: newContent,
              title: scrap.getTitle(),
              order: scrap.getOrder(),
              id: scrap.id,
              type: scrap.type
            })
          : scrap
      )
    );
  }, []);

  /**
   * メモタイトルの更新
   */
  const updateScrapTitle = useCallback((id: number, newTitle: string) => {
    setScraps(prevScraps =>
      prevScraps.map(scrap => {
        if (scrap.id === id) {
          const updatedScrap = new ScrapModel({
            content: scrap.getContent(),
            title: newTitle,
            order: scrap.getOrder(),
            id: scrap.id,
            type: scrap.type
          });

          const scrapData = generateScrap(scrap.id, scrap.file, scrap.type, scrap.getOrder());
          scrapData.title = newTitle;
          window.projectAPI.saveScrapJson(scrapData);

          return updatedScrap;
        }
        return scrap;
      })
    );
  }, []);

  /**
   * メモの並び替え
   */
  const reorderScraps = useCallback((sourceIndex: number, destinationIndex: number) => {
    if (sourceIndex === destinationIndex) return;

    setScraps(prevScraps => {
      const result = [...prevScraps];
      const [moved] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, moved);

      const newScraps = result.map((scrap, index) => {
        let newOrder = 0;
        if (index === 0) {
          newOrder = result[1]?.getOrder() ? result[1].getOrder() / 2 : 1.0;
        } else if (index === result.length - 1) {
          newOrder = result[index - 1].getOrder() + 1.0;
        } else {
          const prevOrder = result[index - 1].getOrder();
          const nextOrder = result[index + 1].getOrder();
          newOrder = (prevOrder + nextOrder) / 2;
        }

        return new ScrapModel({
          content: scrap.getContent(),
          title: scrap.getTitle(),
          order: newOrder,
          id: scrap.id,
          type: scrap.type
        });
      });

      return newScraps;
    });
  }, []);

  /**
   * メモの削除
   */
  const deleteScrap = useCallback((id: number) => {
    setScraps(prevScraps => {
      const filtered = prevScraps.filter(scrap => scrap.id !== id);
      if (filtered.length > 0 && id === selectedScrapId) {
        setSelectedScrapId(filtered[0].id);
      }
      return filtered.map((scrap, index) => new ScrapModel({
        content: scrap.getContent(),
        title: scrap.getTitle(),
        order: index,
        id: scrap.id,
        type: scrap.type
      }));
    });
  }, [selectedScrapId]);

  /**
   * 選択中のメモを取得
   */
  const getSelectedScrap = useCallback(() => {
    return scraps.find(scrap => scrap.id === selectedScrapId) || null;
  }, [scraps, selectedScrapId]);

  /**
   * 並び順で全メモを返却
   */
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


import { useState, useCallback, useEffect, useRef } from 'react';
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
  addScrapFromFile: (filePaths: string[]) => Promise<void | null>;
  openProjectFiles: () => Promise<void>;
} => {
  const [scraps, setScraps] = useState<ScrapModel[]>([]);
  const [selectedScrapId, setSelectedScrapId] = useState<number>(0);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 初期化処理：scraps.json + mdファイル読み込み
   */
  useEffect(() => {
    const loadScraps = async () => {
      try {
        const jsonScraps = await window.api.scrap.loadJson();

        const loadedScraps = await Promise.all(
          jsonScraps.map(async (item: any) => {
            const fileName = `${item.title}.md`;
            const filePath = await window.api.project.getPath();
            const content = await window.api.file.read(filePath + '/' + fileName);
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
      title: 'New Title ' + scraps.length,
      order: newOrder
    });

    setScraps([...scraps, newScrap]);
    setSelectedScrapId(newScrap.id);

    const scrapData = generateScrap(newScrap.id, newScrap.title, 'file', newOrder);
    window.api.scrap.saveJson(scrapData);

    return newScrap.id;
  }, [scraps]);

  /**
   * メモ内容の更新
   */
  const updateScrapContent = useCallback(async (id: number, newContent: string) => {
    // 更新対象 scrap をこの時点で取得（クロージャから分離）
    const scrapToSave = scraps.find(scrap => scrap.id === id);
    if (!scrapToSave) return;

    setScraps(prev =>
      prev.map(scrap =>
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

    // タイマーがすでにあればキャンセル
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // 指定秒後に自動保存
    const timeInterval = await window.api.project.getInterval();
    console.log(timeInterval);
    autoSaveTimeoutRef.current = setTimeout(() => {
      // 内容を md ファイルとして保存
      window.api.project.getPath().then(projectPath => {
        const filePath = `${projectPath}/${scrapToSave.getTitle()}.md`;
        const result = window.api.file.save(filePath, newContent);
      });
      // scraps.json 更新（ファイル名変わらなければ不要かも）
      const scrapData = generateScrap(id, scrapToSave.getTitle(), scrapToSave.type, scrapToSave.getOrder());
      window.api.scrap.saveJson(scrapData);
    }, timeInterval);
  }, [scraps]);

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
          window.api.scrap.saveJson(scrapData);

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
        const content = await window.api.file.read(filePath);
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

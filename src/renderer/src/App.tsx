import { useCallback, useEffect, useState } from 'react';
import Button from './components/Button';
import Scrap from './components/Scrap';
import Setting from './components/Setting';
import useScrapViewModel from './viewmodel/ScrapViewModel';
import { initializeProject } from './utils/fileUtils';
import { useLocation } from 'react-router-dom';

function App(): JSX.Element {
  const location = useLocation();
  const [showSetting, setShowSetting] = useState(location.hash === '#setting');
  console.log('App component rendered');

  const {
    scraps,
    selectedScrapId,
    setSelectedScrapId,
    addScrap,
    updateScrapContent,
    updateScrapTitle,
    reorderScraps,
    deleteScrap,
    addScrapFromFile,
    openProjectFiles,
  } = useScrapViewModel();

  useEffect(() => {
    setShowSetting(location.hash === '#setting');
  }, [location]);


  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // ファイル保存処理
  const handleSaveScrap = async (
    id: number,
    content: string,
    title: string,
    filePath?: string
  ): Promise<void> => {
    try {
      // ファイル名はタイトルに基づいて生成
      const fileName =
        filePath ||
        `${title.replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fa5]/gi, '_').toLowerCase()}.md`

      // レンダラープロセスからPreloadプロセスを経由して、メインプロセスの保存処理を呼び出す
      const result = await window.api.file.save(fileName, content);

      if (result) {
        console.log(`Saved: ${result.filePath}`);
        alert(`ファイルを保存しました: ${result.filePath}`);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('ファイルの保存に失敗しました');
    }
  };

  // ドラッグ開始時の処理
  const handleDragStart = useCallback((index: number): void => {
    setDraggedIndex(index);
  }, []);

  // ドラッグ中の処理
  const handleDragOver = useCallback((hoverIndex: number): void => {
      if (draggedIndex === null || draggedIndex === hoverIndex) {
        return
      }
      // 同一スクラップの上にいる時間が長いと reorder が無駄に起きてしまう
      // → dragover は頻繁に発火するため、一度 reorder した後は index が変わるまで無視
      reorderScraps(draggedIndex, hoverIndex)
      setDraggedIndex(hoverIndex)
    },
    [draggedIndex, reorderScraps]
  )

  // ドラッグ終了時の処理
  const handleDragEnd = useCallback((): void => {
    setDraggedIndex(null);

    // `scraps` は reorderScraps の useCallback で更新済みのはず
    // UUID と order の一覧を main プロセスに送信
    const updatedScraps = scraps.map(scrap => ({
      id: scrap.id,
      type: scrap.type,
      title: scrap.title,
      order: scrap.order
    }));
    window.api.scrap.updateOrder(updatedScraps);
  }, [scraps]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">LoreNote</h1>
        <Button onClick={addScrap} variant="primary" size="addBtn">
          新しいメモを追加
        </Button>
      </header>
      <main className="app-content">
        <div className="scraps-container">
          {scraps.map((scrap, index) => (
            <Scrap
              key={scrap.id}
              scrap={scrap}
              isSelected={scrap.id === selectedScrapId}
              onContentChange={updateScrapContent}
              onTitleChange={updateScrapTitle}
              onSelect={setSelectedScrapId}
              onDelete={deleteScrap}
              onSave={handleSaveScrap}
              index={index}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </main>
      {showSetting && <Setting onClose={() => setShowSetting(false)} />}
    </div>
  );
}

export default App;

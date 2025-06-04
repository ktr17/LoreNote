import { useCallback, useEffect, useState } from 'react';
import Button from './components/Button';
import Scrap from './components/Scrap';
import Setting from './components/Setting';
import useScrapViewModel from './viewmodel/ScrapViewModel';
import './assets/main.css';
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
      const result = await window.myApp.saveFile(fileName, content);

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
  const handleDragOver = useCallback((index: number): void => {
      if (draggedIndex !== null && draggedIndex !== index) {
        // ドラッグ中のアイテムを新しい位置に移動
        reorderScraps(draggedIndex, index)
        setDraggedIndex(index)
      }
    },
    [draggedIndex, reorderScraps]
  )

  // ドラッグ終了時の処理
  const handleDragEnd = useCallback((): void => {
    setDraggedIndex(null);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">LoreNote</h1>
        <Button onClick={addScrap} variant="primary">
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

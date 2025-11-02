/// <reference path="../../preload/preload.d.ts" />

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './components/Button';
import Scrap from './components/Scrap';
import Setting from './components/Setting';
import useScrapViewModel from './viewmodel/ScrapViewModel';
import { useLocation } from 'react-router-dom';
import type { Project } from '../../types/project';

function App(): JSX.Element {
  const location = useLocation();
  const [showSetting, setShowSetting] = useState(location.hash === '#setting');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

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

  const navigate = useNavigate();

  // プロジェクト一覧と現在のプロジェクトを読み込む
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const loadedProjects = await window.api.project.getProjects();
        setProjects(loadedProjects);

        const current = await window.api.project.getCurrentProject();
        setCurrentProject(current);
      } catch (error) {
        console.error('プロジェクトの読み込みエラー:', error);
      }
    };

    loadProjects();
  }, []);

  // プロジェクト切り替えハンドラ
  const handleProjectChange = async (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const projectId = event.target.value;
    if (!projectId) return;

    try {
      await window.api.project.setCurrentProject(projectId);
      const selectedProject = projects.find((p) => p.id === projectId);
      if (selectedProject) {
        setCurrentProject(selectedProject);
        // ページをリロードして新しいプロジェクトのスクラップを読み込む
        window.location.reload();
      }
    } catch (error) {
      console.error('プロジェクト切り替えエラー:', error);
      alert('プロジェクトの切り替えに失敗しました');
    }
  };

  useEffect(() => {
    // メインプロセスからの設定画面遷移指示を受信
    const handleNavigateToSetting = () => {
      navigate('/setting');
    };

    window.api.navigation.onNavigateToSetting(handleNavigateToSetting);

    return () => {
      window.api.navigation.offNavigateToSettingListener();
    };
  }, [navigate]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // ファイル保存処理
  const handleSaveScrap = async (
    id: number,
    content: string,
    title: string,
    filePath?: string,
  ): Promise<void> => {
    try {
      // ファイル名はタイトルに基づいて生成
      const fileName =
        filePath ||
        `${title.replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fa5]/gi, '_').toLowerCase()}.md`;

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
  const handleDragOver = useCallback(
    (hoverIndex: number): void => {
      if (draggedIndex === null || draggedIndex === hoverIndex) {
        return;
      }
      // 同一スクラップの上にいる時間が長いと reorder が無駄に起きてしまう
      // → dragover は頻繁に発火するため、一度 reorder した後は index が変わるまで無視
      reorderScraps(draggedIndex, hoverIndex);
      setDraggedIndex(hoverIndex);
    },
    [draggedIndex, reorderScraps],
  );

  // ドラッグ終了時の処理
  const handleDragEnd = useCallback((): void => {
    setDraggedIndex(null);

    // `scraps` は reorderScraps の useCallback で更新済みのはず
    // UUID と order の一覧を main プロセスに送信
    const updatedScraps = scraps.map((scrap) => ({
      id: scrap.id,
      type: scrap.type,
      title: scrap.title,
      order: scrap.order,
    }));
    window.api.scrap.updateOrder(updatedScraps);
  }, [scraps]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">LoreNote</h1>
        {projects.length > 0 && (
          <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="project-selector" style={{ fontSize: '14px', color: '#ccc' }}>
              プロジェクト:
            </label>
            <select
              id="project-selector"
              value={currentProject?.id || ''}
              onChange={handleProjectChange}
              style={{
                padding: '5px 10px',
                backgroundColor: '#2b2b2b',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button onClick={addScrap} variant="additionalMemo" size="addBtn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          メモを追加
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

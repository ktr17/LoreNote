import React, { useState, useEffect, useRef } from 'react';
import useEditorSetting from '../hooks/useEditorSetting';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../../types/project';

interface SettingProps {}

const Setting: React.FC<SettingProps> = ({}): JSX.Element => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectPath, setNewProjectPath] = useState<string>('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState<string>('');

  const minSaveInterval = 5;
  const minEditorHeight = 50;
  const [saveInterval, setSaveInterval] = useState<number>(0);
  const [localEditorHeight, setLocalEditorHeight] = useState<number>(0);

  const { editorHeight, setEditorHeight, saveEditorHaight } =
    useEditorSetting();
  const cursorRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async (): Promise<void> => {
      try {
        const loadedProjects = await window.api.project.getProjects();
        setProjects(loadedProjects);
      } catch (error) {
        console.error('getProjects()の取得エラー: ', error);
      }
    };

    const loadCurrentProject = async (): Promise<void> => {
      try {
        const current = await window.api.project.getCurrentProject();
        setCurrentProject(current);
      } catch (error) {
        console.error('getCurrentProject()の取得エラー: ', error);
      }
    };

    const loadIntervalTime = async (): Promise<void> => {
      try {
        const intervalTime = await window.api.project.getInterval();
        setSaveInterval(Number(intervalTime));
      } catch (error) {
        console.error('getIntervalTime でエラー:', error);
      }
    };
    const loadEdigotHeight = async (): Promise<void> => {
      try {
        const height = await window.api.project.getEditorHeight();
        if (height != null) {
          setEditorHeight(height);
        }
      } catch (error) {
        console.error('getEditorHeight()の取得エラー: ', error);
      }
    };

    loadProjects();
    loadCurrentProject();
    loadIntervalTime();
    loadEdigotHeight();
  }, []);

  // editorHeightが変わったらLocalEditorHeightも更新する
  useEffect(() => {
    setLocalEditorHeight(editorHeight);
  }, [editorHeight]);

  // 入力中はローカルstateのみ更新
  const handleEditorHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value < minEditorHeight) {
      setLocalEditorHeight(minEditorHeight);
    } else {
      setLocalEditorHeight(value);
    }
  };

  const handleApply = async (): Promise<void> => {
    const resultSaveInterval: any =
      await window.api.project.saveInterval(saveInterval);
    setEditorHeight(localEditorHeight);

    const resultSaveHeight = await saveEditorHaight(localEditorHeight);

    if (resultSaveInterval || resultSaveHeight) {
      alert('保存しました。');
      console.log('保存しました');
    } else {
      alert('保存に失敗しました');
      console.log('保存失敗');
    }
  };

  const handleAddProject = async (): Promise<void> => {
    if (!newProjectName || !newProjectPath) {
      alert('プロジェクト名とパスを入力してください。');
      return;
    }

    try {
      const newProject = await window.api.project.addProject(
        newProjectName,
        newProjectPath,
      );
      setProjects([...projects, newProject]);
      setNewProjectName('');
      setNewProjectPath('');

      // 最初のプロジェクトの場合は自動的に選択
      if (projects.length === 0) {
        setCurrentProject(newProject);
      }

      alert('プロジェクトを追加しました。');
    } catch (error) {
      console.error('プロジェクト追加エラー:', error);
      alert('プロジェクトの追加に失敗しました。');
    }
  };

  const handleFolderSelect = async (): Promise<void> => {
    const folder: any = await window.api.dialog.openFolder();
    if (!folder.canceled && folder.folderPath) {
      setNewProjectPath(folder.folderPath);
    }
  };

  const handleSelectProject = async (project: Project): Promise<void> => {
    try {
      await window.api.project.setCurrentProject(project.id);
      setCurrentProject(project);
      alert(`プロジェクト「${project.name}」を選択しました。`);
    } catch (error) {
      console.error('プロジェクト選択エラー:', error);
      alert('プロジェクトの選択に失敗しました。');
    }
  };

  const handleDeleteProject = async (projectId: string): Promise<void> => {
    if (!confirm('このプロジェクトを削除してもよろしいですか？')) {
      return;
    }

    try {
      await window.api.project.removeProject(projectId);
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      setProjects(updatedProjects);

      // 削除されたプロジェクトが現在選択中の場合
      if (currentProject?.id === projectId) {
        if (updatedProjects.length > 0) {
          setCurrentProject(updatedProjects[0]);
        } else {
          setCurrentProject(null);
        }
      }

      alert('プロジェクトを削除しました。');
    } catch (error) {
      console.error('プロジェクト削除エラー:', error);
      alert('プロジェクトの削除に失敗しました。');
    }
  };

  const handleStartEditProjectName = (project: Project): void => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const handleSaveProjectName = async (projectId: string): Promise<void> => {
    if (!editingProjectName.trim()) {
      alert('プロジェクト名を入力してください。');
      return;
    }

    try {
      await window.api.project.updateProject(projectId, editingProjectName);
      setProjects(
        projects.map((p) =>
          p.id === projectId ? { ...p, name: editingProjectName } : p,
        ),
      );
      setEditingProjectId(null);
      setEditingProjectName('');

      // 現在のプロジェクトを更新
      if (currentProject?.id === projectId) {
        setCurrentProject({ ...currentProject, name: editingProjectName });
      }
    } catch (error) {
      console.error('プロジェクト名更新エラー:', error);
      alert('プロジェクト名の更新に失敗しました。');
    }
  };

  const handleCancelEditProjectName = (): void => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const checkProjectPath = () => {
    if (!currentProject) {
      alert('プロジェクトが選択されていません。\nプロジェクトを追加して選択してください。');
    } else {
      navigate('/');
    }
  };

  return (
    <div
      style={{
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        color: '#fff',
        fontFamily: 'Segoe UI, sans-serif',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          backgroundColor: '#2c2c2c',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 0 20px rgba(0,0,0,0.4)',
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: '240px',
            padding: '20px',
            backgroundColor: '#1f1f1f',
            borderRight: '1px solid #444',
          }}
        >
          <h2 style={{ fontSize: '16px', marginBottom: '20px', color: '#ccc' }}>
            設定
          </h2>
          <div
            style={{
              ...menuItemStyle,
              backgroundColor: '#3a3a3a',
              color: '#fff',
            }}
          >
            ⚙️ 一般
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: '30px',
            overflowY: 'auto',
          }}
        >
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '16px',
              borderBottom: '1px solid #444',
              paddingBottom: '8px',
              color: '#eee',
            }}
          >
            プロジェクト管理
          </h3>

          {/* 現在のプロジェクト表示 */}
          {currentProject && (
            <div style={{ ...settingItem, marginBottom: '20px' }}>
              <label style={{ marginBottom: '5px', display: 'block', color: '#aaa' }}>
                現在のプロジェクト
              </label>
              <div
                style={{
                  padding: '10px',
                  backgroundColor: '#3a3a3a',
                  borderRadius: '5px',
                  color: '#fff',
                }}
              >
                {currentProject.name} ({currentProject.path})
              </div>
            </div>
          )}

          {/* プロジェクト一覧 */}
          <div style={settingItem}>
            <label style={{ marginBottom: '10px', display: 'block' }}>
              プロジェクト一覧
            </label>
            {projects.length === 0 ? (
              <p style={{ color: '#888' }}>プロジェクトがありません</p>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    style={{
                      padding: '10px',
                      marginBottom: '10px',
                      backgroundColor: currentProject?.id === project.id ? '#3a5a3a' : '#2b2b2b',
                      border: '1px solid #555',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {editingProjectId === project.id ? (
                        <input
                          type="text"
                          value={editingProjectName}
                          onChange={(e) => setEditingProjectName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '5px',
                            backgroundColor: '#1e1e1e',
                            border: '1px solid #555',
                            borderRadius: '3px',
                            color: '#fff',
                          }}
                        />
                      ) : (
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                            {project.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#aaa' }}>
                            {project.path}
                          </div>
                        </div>
                      )}
                    </div>
                    {editingProjectId === project.id ? (
                      <>
                        <button
                          onClick={() => handleSaveProjectName(project.id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#4a7c59',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEditProjectName}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#666',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          キャンセル
                        </button>
                      </>
                    ) : (
                      <>
                        {currentProject?.id !== project.id && (
                          <button
                            onClick={() => handleSelectProject(project)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#4a7c59',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                            }}
                          >
                            選択
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEditProjectName(project)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#5a5a5a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#7c4a4a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          削除
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 新規プロジェクト追加 */}
          <div style={settingItem}>
            <label style={{ marginBottom: '10px', display: 'block' }}>
              新規プロジェクト追加
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="プロジェクト名"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                style={{
                  padding: '10px',
                  backgroundColor: '#2b2b2b',
                  border: '1px solid #555',
                  borderRadius: '5px',
                  color: '#fff',
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="パス"
                  value={newProjectPath}
                  onChange={(e) => setNewProjectPath(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#2b2b2b',
                    border: '1px solid #555',
                    borderRadius: '5px',
                    color: '#fff',
                  }}
                />
                <button
                  onClick={handleFolderSelect}
                  style={{
                    padding: '10px 15px',
                    backgroundColor: '#3a3a3a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  選択
                </button>
              </div>
              <button
                onClick={handleAddProject}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4a7c59',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                追加
              </button>
            </div>
          </div>

          {/* 保存設定 */}
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginTop: '40px',
              marginBottom: '16px',
              borderBottom: '1px solid #444',
              paddingBottom: '8px',
              color: '#eee',
            }}
          >
            保存設定
          </h3>
          {/* 保存間隔の入力フィールド */}
          <div
            style={{ ...settingItem, display: 'flex', alignItems: 'center' }}
          >
            <label
              htmlFor="save-interval"
              style={{ marginRight: '10px', whiteSpace: 'nowrap' }}
            >
              保存間隔
            </label>
            <input
              id="save-interval"
              type="number"
              min={minSaveInterval}
              value={saveInterval}
              onChange={(e) => {
                if (Number(e.target.value) < minSaveInterval) {
                  setSaveInterval(minSaveInterval);
                } else {
                  setSaveInterval(Number(e.target.value));
                }
              }}
              style={{
                width: '80px',
                padding: '8px',
                backgroundColor: '#2b2b2b',
                border: '1px solid #555',
                borderRadius: '5px',
                color: '#fff',
                marginRight: '8px',
              }}
            />
            <span>秒</span>
          </div>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginTop: '40px',
              marginBottom: '16px',
              borderBottom: '1px solid #444',
              paddingBottom: '8px',
              color: '#eee',
            }}
          >
            エディタ設定
          </h3>
          {/* エディタの表示高さの入力フィールド */}
          <div
            style={{ ...settingItem, display: 'flex', alignItems: 'center' }}
          >
            <label
              htmlFor="editor-height"
              style={{ marginRight: '10px', whiteSpace: 'nowrap' }}
            >
              高さ
            </label>
            <input
              id="editor-height"
              type="number"
              min={50}
              value={localEditorHeight}
              onChange={handleEditorHeightChange}
              style={{
                width: '80px',
                padding: '8px',
                backgroundColor: '#2b2b2b',
                border: '1px solid #555',
                borderRadius: '5px',
                color: '#fff',
                marginRight: '8px',
              }}
            />
            <span>px</span>
          </div>

          <div
            style={{
              marginTop: '40px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              onClick={checkProjectPath}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3a3a3a',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              戻る
            </button>
            <button
              onClick={handleApply}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3a3a3a',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              適用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const menuItemStyle: React.CSSProperties = {
  padding: '10px',
  marginBottom: '10px',
  borderRadius: '5px',
  color: '#ccc',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

const settingItem: React.CSSProperties = {
  marginBottom: '20px',
};

export default Setting;

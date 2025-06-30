import React, { useState, useEffect, useCallback } from 'react';
import { useSettingViewModel } from '../viewmodel/useSettingViewModel';

interface SettingProps {
  onClose: () => void;
}

type SaveResult = {
  success: boolean;
  filePath?: string;
};

const Setting: React.FC<SettingProps> = ({ onClose }): JSX.Element => {
  const [projectPath, setProjectPath] = useState<string>('');
  const [saveInterval, setSaveInterval] = useState<number>(0);
  const { maxEditorHeight, setMaxEditorHeight } = useSettingViewModel();

  const loadProjectPath = useCallback(async () => {
    const path = await window.api.project.getPath();
    if (path) setProjectPath(path);
  }, []);

  const loadIntervalTime = useCallback(async () => {
    try {
      const intervalTime = await window.api.project.getInterval();
      console.log('取得した intervalTime:', intervalTime);
      setSaveInterval(Number(intervalTime));
    } catch (error) {
      console.error('getIntervalTime でエラー:', error);
    }
  }, []);

  const loadMaxEditorHeight = useCallback(async () => {
    const height = await window.api.project.getMaxEditorHeight();
    console.log('取得した maxEditorHeight:', height);
    const numericHeight = Number(height);
    if (!isNaN(numericHeight)) {
      setMaxEditorHeight(numericHeight);
    }
  }, []);

  useEffect(() => {
    loadProjectPath();
    loadIntervalTime();
    loadMaxEditorHeight();
  }, []);

  useEffect(() => {
    console.log('設定画面で maxEditorHeight が変更されました:', maxEditorHeight);
  }, [maxEditorHeight]);

  const handleApply = async (): Promise<void> => {
    const resultSavePath: SaveResult = await window.api.project.savePath(projectPath);
    const resultSaveInterval: SaveResult = await window.api.project.saveInterval(saveInterval);
    let resultSaveMaxEditorHeight: SaveResult;
    try {
      resultSaveMaxEditorHeight = await window.api.project.saveMaxEditorHeight(number(maxEditorHeight));
    } catch (error) {
      console.info(error)
    }

    if ((resultSavePath == true) && (resultSaveInterval == true) && (resultSaveMaxEditorHeight == true)) {
      console.log('保存しました');
    } else {
      console.log('保存失敗');
    }

    setMaxEditorHeight(maxEditorHeight);
  };

  const handleFolderSelect = async (): Promise<void> => {
    const folder = await window.api.dialog.openFolder();
    if (!folder.canceled && folder.folderPath) {
      setProjectPath(folder.folderPath);
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
        zIndex: 1000
      }}
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          backgroundColor: '#2c2c2c',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 0 20px rgba(0,0,0,0.4)'
        }}
      >
        <div
          style={{
            width: '240px',
            padding: '20px',
            backgroundColor: '#1f1f1f',
            borderRight: '1px solid #444',
          }}
        >
          <h2 style={{ fontSize: '16px', marginBottom: '20px', color: '#ccc' }}>設定</h2>
          <div style={{ ...menuItemStyle, backgroundColor: '#3a3a3a', color: '#fff' }}>⚙️ 一般</div>
        </div>

        <div
          style={{
            flex: 1,
            padding: '30px',
            overflowY: 'auto'
          }}
        >
          <h3 style={sectionHeader}>プロジェクト設定</h3>
          <div style={{ ...settingItem, display: 'flex', alignItems: 'center' }}>
            <label style={{ marginRight: '10px' }}>格納先</label>
            <input
              type="text"
              placeholder="/Users/yourname/Documents"
              style={inputStyle}
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
            />
            <button onClick={handleFolderSelect} style={buttonStyle}>...</button>
          </div>

          <div style={{ ...settingItem, display: 'flex', alignItems: 'center' }}>
            <label style={{ marginRight: '10px', whiteSpace: 'nowrap' }}>表示サイズ(px)</label>
            <input
              type="text"
              min={100}
              value={maxEditorHeight}
              onChange={(e) => setMaxEditorHeight(Number(e.target.value))}
              style={numberInputStyle}
            />
          </div>

          <h3 style={sectionHeader}>保存設定</h3>
          <div style={{ ...settingItem, display: 'flex', alignItems: 'center' }}>
            <label style={{ marginRight: '10px', whiteSpace: 'nowrap' }}>保存間隔</label>
            <input
              type="number"
              min={1}
              value={saveInterval}
              onChange={(e) => setSaveInterval(Number(e.target.value))}
              style={numberInputStyle}
            />
            <span>秒</span>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={onClose} style={buttonStyle}>閉じる</button>
            <button onClick={handleApply} style={buttonStyle}>適用</button>
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

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  backgroundColor: '#2b2b2b',
  border: '1px solid #555',
  borderRadius: '5px',
  color: '#fff',
};

const numberInputStyle: React.CSSProperties = {
  width: '80px',
  padding: '8px',
  backgroundColor: '#2b2b2b',
  border: '1px solid #555',
  borderRadius: '5px',
  color: '#fff',
  marginRight: '8px',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#3a3a3a',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

const sectionHeader: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginTop: '40px',
  marginBottom: '16px',
  borderBottom: '1px solid #444',
  paddingBottom: '8px',
  color: '#eee',
};

export default Setting;

import React, { useState, useEffect } from 'react';

interface SettingProps {
  onClose: () => void;
}

const Setting: React.FC<SettingProps> = ({ onClose }): JSX.Element => {
  const [projectPath, setProjectPath] = useState<string>('');
  const [saveInterval, setSaveInterval] = useState<number>(0);

  useEffect(() => {
    const loadProjectPath = async (): Promise<void> => {
      const path = await window.api.project.getPath();
      if (path) {
        setProjectPath(path);
      }
    };
    const loadIntervalTime = async (): Promise<void> => {
      try {
        const intervalTime = await window.api.project.getInterval();
        console.log('取得した intervalTime:', intervalTime);
        setSaveInterval(Number(intervalTime));
      } catch (error) {
        console.error('getIntervalTime でエラー:', error);
      }
    };
    loadProjectPath();
    loadIntervalTime();
  }, []);

  const handleApply = async (): Promise<void> => {
    const resultSavePath: any = await window.api.project.savePath(projectPath);
    const resultSaveInterval: any =
      await window.api.project.saveInterval(saveInterval);
    if (resultSavePath || resultSaveInterval) {
      // ファイル保存処理
      alert('保存しました。');
      console.log('保存しました');
    } else {
      alert('保存に失敗しました');
      console.log('保存失敗');
    }
  };

  const handleFolderSelect = async (): Promise<void> => {
    const folder: any = await window.api.dialog.openFolder();
    if (!folder.canceled && folder.folderPath) {
      setProjectPath(folder.folderPath);
    }
  };

  const checkProjectPath = () => {
    if (!projectPath) {
      alert('プロジェクトパスが空です。\nプロジェクトパスを入力してください。');
    } else {
      onClose();
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
            プロジェクト設定
          </h3>
          <div
            style={{ ...settingItem, display: 'flex', alignItems: 'center' }}
          >
            <label style={{ marginRight: '10px' }}>格納先</label>
            <input
              type="text"
              placeholder="/Users/yourname/Documents"
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#2b2b2b',
                border: '1px solid #555',
                borderRadius: '5px',
                color: '#fff',
              }}
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
            />
            <button
              onClick={handleFolderSelect}
              style={{
                padding: '5px 10px',
                backgroundColor: '#3a3a3a',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginLeft: '5px',
              }}
            >
              ...
            </button>
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
            <label style={{ marginRight: '10px', whiteSpace: 'nowrap' }}>
              保存間隔
            </label>
            <input
              type="number"
              min={1}
              value={saveInterval}
              onChange={(e) => setSaveInterval(Number(e.target.value))}
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
              閉じる
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

const selectStyle: React.CSSProperties = {
  backgroundColor: '#2b2b2b',
  color: '#fff',
  border: '1px solid #555',
  padding: '8px',
  borderRadius: '5px',
  width: '100%',
};

export default Setting;

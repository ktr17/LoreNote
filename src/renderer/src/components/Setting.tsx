import React from 'react';

interface SettingProps {
  onClose: () => void;
}

const Setting: React.FC<SettingProps> = ({ onClose }) => {
  return (
    <div style={{
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
    }}>
      <div style={{
        display: 'flex',
        height: '100%',
        backgroundColor: '#2c2c2c',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 0 20px rgba(0,0,0,0.4)'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '240px',
          padding: '20px',
          backgroundColor: '#1f1f1f',
          borderRight: '1px solid #444',
        }}>
          <h2 style={{ fontSize: '16px', marginBottom: '20px', color: '#ccc' }}>設定</h2>
          <div style={{ ...menuItemStyle, backgroundColor: '#3a3a3a', color: '#fff' }}>⚙️ 一般</div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '30px',
          overflowY: 'auto',
        }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>エディタ設定</h3>

          <div style={settingItem}>
            <label>フォルダパスを選択</label>
            <input type="text"
              placeholder="/Users/yourname/Documents"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#2b2b2b',
                border: '1px solid #555',
                borderRadius: '5px',
                color: '#fff',
              }}
            />
          </div>

          <div style={{ marginTop: '40px' }}>
            <button
              onClick={onClose}
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

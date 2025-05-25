import { useState, useRef, useEffect } from 'react';
import MDEditor from './MarkdownEditor';
import Button from './Button';
import ScrapModel from '../model/ScrapModel';

interface ScrapProps {
  scrap: ScrapModel;
  isSelected: boolean;
  onContentChange: (id: number, content: string) => void;
  onTitleChange: (id: number, title: string) => void;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  onSave: (id: number, content: string, title: string, filePath?: string) => void;
}

export const Scrap = ({
  scrap,
  isSelected,
  onContentChange,
  onTitleChange,
  onSelect,
  onDelete,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  onSave
}: ScrapProps): JSX.Element => {
  const [title, setTitle] = useState(scrap.getTitle());
  const [content, setContent] = useState(scrap.getContent());
  const scrapRef = useRef<HTMLDivElement>(null);

  // スクラップが更新されたら状態を更新
  useEffect(() => {
    setTitle(scrap.getTitle());
    setContent(scrap.getContent());
  }, [scrap]);

  const handleContentChange = (value: string): void => {
    setContent(value);
    onContentChange(scrap.id, value);

    // タイトルが空の場合、コンテンツの最初の行をタイトルとして設定
    if (!title && value) {
      const firstLine = value.split('\n')[0].replace(/^#\s*/, '');
      if (firstLine) {
        const newTitle = firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
        setTitle(newTitle);
        onTitleChange(scrap.id, newTitle);
      }
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onTitleChange(scrap.id, newTitle);
  };

  // レンダラープロセスからプリロードプロセスのファイル保存関数を呼び出す
  const handleSave = async (): Promise<void> => {
    try {
      const result = await window.api.openDialog()

      if (result && result.filePath) {
        // ファイル保存処理
        console.log(content);
        await onSave(scrap.id, content, title, result.filePath);
      }
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };
  const handleDelete = (): void => {
    onDelete(scrap.id);
  };

  const handleClick = (): void => {
    onSelect(scrap.id);
  };

  const handleDragStart = (e: React.DragEvent): void => {
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (scrapRef.current) {
        scrapRef.current.classList.add('dragging');
      }
    }, 0);
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    onDragOver(index);
  };

  const handleDragEnd = (): void => {
    if (scrapRef.current) {
      scrapRef.current.classList.remove('dragging');
    }
    onDragEnd();
  };

  // フォルダパスを設定する(プロジェクトパス)
  const selectFolder = async (): Promise<void> => {
    const folder = await window.electronAPI.openFolderDialog();
    if (folder) {
      await window.projectAPI.saveProjectPath(folder);
      alert(`プロジェクトパスを保存しました: ${folder}`);
    }
  };

  // フォルダパスを読み込む(プロジェクトパス)
  const loadProject = async () => {
    const savedPath = await window.projectAPI.getProjectPath();
    alert('前回開いたプロジェクト:', savedPath);
  };

  return (
    <div
      ref={scrapRef}
      className={`scrap-container ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="scrap-header">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="タイトルを入力"
          className="scrap-title-input"
        />
        <div className="scrap-actions">
          <Button onClick={handleSave} variant="primary" size="small">
            保存
          </Button>
          <Button onClick={handleDelete} variant="danger" size="small">
            削除
          </Button>
          <Button onClick={selectFolder} variant="danger" size="small">
            選択
          </Button>
        </div>
      </div>

      {isSelected && (
        <div className="scrap-editor">
          <MDEditor
            value={content}
            onChange={handleContentChange}
            placeholder="ここにメモを入力してください"
          />
        </div>
      )}
    </div>
  );
};

export default Scrap;

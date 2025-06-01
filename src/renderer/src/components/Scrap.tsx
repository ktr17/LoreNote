import { useState, useRef, useEffect, useCallback } from 'react';
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

const Scrap = ({
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
  onSave,
}: ScrapProps): JSX.Element => {
  const [title, setTitle] = useState(scrap.getTitle());
  const [content, setContent] = useState(scrap.getContent());
  const scrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(scrap.getTitle());
    setContent(scrap.getContent());
  }, [scrap]);

  const extractTitleFromContent = (text: string): string => {
    const firstLine = text.split('\n')[0].replace(/^#\s*/, '');
    return firstLine.length > 30 ? `${firstLine.slice(0, 30)}...` : firstLine;
  };

  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value);
      onContentChange(scrap.id, value);

      if (!title && value) {
        const newTitle = extractTitleFromContent(value);
        setTitle(newTitle);
        onTitleChange(scrap.id, newTitle);
      }
    },
    [scrap.id, onContentChange, onTitleChange, title]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onTitleChange(scrap.id, newTitle);
  };

  const handleSave = async () => {
    try {
      const projectPath = await window.projectAPI.getProjectPath();
      const filePath = projectPath
        ? `${projectPath}/${title}.md`
        : (await window.api.openDialog()).filePath;

      if (filePath) {
        await onSave(scrap.id, content, title, filePath);
      }
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const handleDelete = () => onDelete(scrap.id);
  const handleClick = () => onSelect(scrap.id);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => scrapRef.current?.classList.add('dragging'), 0);
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(index);
  };

  const handleDragEnd = () => {
    scrapRef.current?.classList.remove('dragging');
    onDragEnd();
  };

  const selectFolder = async () => {
    const folder = await window.electronAPI.openFolderDialog();
    if (folder) {
      await window.projectAPI.saveProjectPath(folder);
      alert(`プロジェクトパスを保存しました: ${folder}`);
    }
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
          <Button onClick={handleSave} variant="primary" size="small">保存</Button>
          <Button onClick={handleDelete} variant="danger" size="small">削除</Button>
          <Button onClick={selectFolder} variant="secondary" size="small">選択</Button>
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

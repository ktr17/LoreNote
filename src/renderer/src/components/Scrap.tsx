import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash.debounce';
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
  }, [scrap]);

  const extractTitleFromContent = (text: string): string => {
    const firstLine = text.split('\n')[0].replace(/^#\s*/, '');
    return firstLine.length > 30 ? `${firstLine.slice(0, 30)}...` : firstLine;
  };

  const handleContentChange = useCallback(
    (value: string): void => { // Added return type
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

  /**
   * タイトルを編集したとき、指定時間経過後にファイル名を変更する
   */
  const updateTitle = useMemo(() =>
    debounce(async (id: string, newTitle: string) => {
      try {
        const projectPath = await window.api.project.getPath();
        const oldTitle = await window.api.scrap.getTitle(id);
        const oldPath = `${projectPath}/${oldTitle}.md`;
        const newPath = `${projectPath}/${newTitle}.md`;

        await window.api.file.rename(oldPath, newPath);
        await window.api.scrap.updateTitle(id, newTitle);
        onTitleChange(scrap.id, newTitle);
      } catch (error) {
        console.error('タイトル更新エラー: ', error);
      }
    }, 2000) // 最後の入力から2000ms後に実行
  , [onTitleChange]);

  /**
   * メモのタイトル(ファイル名)を変更したときに、scraps.jsonとファイル名を変更する
   */
  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onTitleChange(scrap.id, newTitle);
  };

  const handleDelete = (): void => onDelete(scrap.id);
  const handleClick = (): void => onSelect(scrap.id);


  const handleDragStart = (e: React.DragEvent): void => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    scrapRef.current?.classList.add('dragging');
    onDragStart(index); // 親にドラッグ元のインデックスを通知
  };

  const handleDragOver = (e: React.DragEvent): void => { // Added return type
    e.preventDefault();
    onDragOver(index);
  };

  const handleDragEnd = (): void => {
    scrapRef.current?.classList.remove('dragging');
    onDragEnd(); // ドラッグ終了を親に通知（並び順変更など）
  };

  const selectFolder = async (): Promise<void> => { // Added return type
    const folder = await window.electronAPI.openFolderDialog();
    if (folder) {
      await window.api.project.savePath(folder);
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
          onChange={(e) => {
            handleTitleChange(e);
          }}
          placeholder="タイトルを入力"
          className="scrap-title-input"
        />
        <div className="scrap-actions">
          <Button onClick={handleDelete} variant="danger" size="small">
            削除
          </Button>
        </div>
      </div>
      <div className="scrap-editor">
        <MDEditor
          value={content}
          onChange={handleContentChange}
          placeholder="ここにメモを入力してください"
        />
      </div>
    </div>
  );
};

export default Scrap;

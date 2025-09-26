import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash.debounce';
import MDEditor from './MarkdownEditor';
import Button from './Button';
import ScrapModel from '../model/ScrapModel';
import DropdownMenu from './DropdownMenu';
import ConfirmDialog from './ConfirmDialog';

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
  onSave: (
    id: number,
    content: string,
    title: string,
    filePath?: string,
  ) => void;
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const scrapRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setTitle(scrap.getTitle());
  }, [scrap]);

  const extractTitleFromContent = (text: string): string => {
    const firstLine = text.split('\n')[0].replace(/^#\s*/, '');
    return firstLine.length > 30 ? `${firstLine.slice(0, 30)}...` : firstLine;
  };

  const handleContentChange = useCallback(
    (value: string): void => {
      setContent(value);
      onContentChange(scrap.id, value);

      if (!title && value) {
        const newTitle = extractTitleFromContent(value);
        setTitle(newTitle);
        onTitleChange(scrap.id, newTitle);
      }
    },
    [scrap.id, onContentChange, onTitleChange, title],
  );

  // タイトル確定処理
  const confirmTitleChange = useCallback(async (): Promise<void> => {
    if (!isEditingTitle) return;

    try {
      const projectPath = await window.api.project.getPath();
      const oldTitle = scrap.getTitle();
      const oldPath = `${projectPath}/${oldTitle}.md`;
      const newPath = `${projectPath}/${title}.md`;

      if (title !== oldTitle && title.trim()) {
        onTitleChange(scrap.id, title);
      }
    } catch (error) {
      console.error('タイトル更新エラー: ', error);
      // エラー時は元のタイトルに戻す
      setTitle(scrap.getTitle());
    } finally {
      setIsEditingTitle(false);
    }
  }, [title, scrap, onTitleChange, isEditingTitle]);

  // キーボードイベントハンドラ
  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault();

        // IME変換確定時のEnter
        if (e.nativeEvent.isComposing) {
          return;
        }
        titleInputRef.current?.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();

        // キャンセルフラグを立てる
        setIsCancelling(true);

        const originalTitle = scrap.getTitle();

        setTitle(originalTitle);
        setIsEditingTitle(false);

        setTimeout(() => {
          titleInputRef.current?.blur();
          // フラグをリセット
          setTimeout(() => {
            setIsCancelling(false);
          }, 10);
        }, 0);
      }
    },
    [title, scrap, isEditingTitle],
  );

  // フォーカスイベントハンドラ
  const handleTitleFocus = useCallback((): void => {
    setIsEditingTitle(true);
  }, []);

  // フォーカスがハズレた場合にファイル名を更新する
  const handleTitleBlur = useCallback((): void => {
    if (isCancelling) {
      return;
    }

    confirmTitleChange();
  }, [confirmTitleChange, isCancelling]);
  // タイトル変更処理（リアルタイム表示のみ）
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newTitle = e.target.value;
      setTitle(newTitle);
    },
    [],
  );

  const handleDelete = (): void => {
    setShowConfirm(true);
  };

  const deleteScrap = (): void => {
    onDelete(scrap.id);
    setShowConfirm(false);
  };

  const handleClick = (): void => onSelect(scrap.id);

  const handleDragStart = (e: React.DragEvent): void => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    scrapRef.current?.classList.add('dragging');
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    onDragOver(index);
  };

  const handleDragEnd = (): void => {
    scrapRef.current?.classList.remove('dragging');
    onDragEnd();
  };

  const selectFolder = async (): Promise<void> => {
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
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          onFocus={handleTitleFocus}
          onBlur={handleTitleBlur}
          placeholder="タイトルを入力"
          className="scrap-title-input"
        />
        <div className="scrap-actions">
          <DropdownMenu onDelete={handleDelete}></DropdownMenu>
          {showConfirm && (
            <ConfirmDialog
              message="このメモを削除しますか？"
              onClose={() => {}}
              open={showConfirm}
              onConfirm={deleteScrap}
              onCancel={() => setShowConfirm(false)}
              buttonText="削除する"
            />
          )}
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

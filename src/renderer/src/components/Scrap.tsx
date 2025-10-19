import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import MDEditor from './MarkdownEditor';
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
}: ScrapProps): JSX.Element => {
  const [title, setTitle] = useState(scrap.getTitle());
  const [content, setContent] = useState(scrap.getContent());
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const scrapRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [titleError, setTitleError] = useState(false);

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
  // タイトルバリデーション
  const validateTitle = useCallback((titleValue: string): boolean => {
    return titleValue.trim().length > 0;
  }, []);

  // エラー表示とフォーカス維持
  const showTitleError = useCallback((): void => {
    setTitleError(true);
    // エラー状態を数秒後にリセット
    setTimeout(() => {
      setTitleError(false);
    }, 3000);

    // フォーカスを維持
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);
  }, []);

  // タイトル確定処理
  const confirmTitleChange = useCallback(async (): Promise<void> => {
    if (!isEditingTitle) return;

    // 最終チェック
    if (!validateTitle(title)) {
      console.log('確定処理でタイトルが空のため処理中断');
      showTitleError();
      return;
    }

    try {
      const projectPath = await window.api.project.getPath();
      const oldTitle = scrap.getTitle();
      const oldPath = `${projectPath}/${oldTitle}.md`;
      const newPath = `${projectPath}/${title.trim()}.md`;

      if (title.trim() !== oldTitle) {
        console.log('ファイル名変更実行:', oldTitle, '->', title.trim());
        onTitleChange(scrap.id, title.trim());
      }
    } catch (error) {
      console.error('タイトル更新エラー: ', error);
      setTitle(scrap.getTitle());
    } finally {
      setIsEditingTitle(false);
      setTitleError(false);
    }
  }, [
    title,
    scrap,
    onTitleChange,
    isEditingTitle,
    validateTitle,
    showTitleError,
  ]);
  // キーボードイベントハンドラ
  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        console.log('=== Enter Debug Info ===');
        console.log('Key:', e.key);
        console.log('nativeEvent.isComposing:', e.nativeEvent.isComposing);
        console.log('Current title:', title);
        console.log('========================');

        e.preventDefault();

        if (e.nativeEvent.isComposing) {
          console.log('IME変換確定のEnter');
          return;
        }

        // タイトルが空の場合は確定を阻止
        if (!validateTitle(title)) {
          console.log('タイトルが空のため確定を阻止');
          showTitleError();
          return;
        }

        console.log('タイトル確定のEnter - blur実行');
        titleInputRef.current?.blur();
      } else if (e.key === 'Escape') {
        console.log('=== Escape処理開始 ===');
        e.preventDefault();

        setIsCancelling(true);
        const originalTitle = scrap.getTitle();

        // 元のタイトルも空の場合の処理
        if (!validateTitle(originalTitle)) {
          console.log('元のタイトルも空のため、デフォルト値を設定');
          const defaultTitle = 'Untitled';
          setTitle(defaultTitle);
          if (titleInputRef.current) {
            titleInputRef.current.value = defaultTitle;
          }
          // 親コンポーネントにも通知
          onTitleChange(scrap.id, defaultTitle);
        } else {
          setTitle(originalTitle);
          if (titleInputRef.current) {
            titleInputRef.current.value = originalTitle;
          }
        }

        setIsEditingTitle(false);
        setTitleError(false); // エラー状態をクリア

        setTimeout(() => {
          setIsCancelling(false);
        }, 100);

        console.log('Escape処理完了');
      }
    },
    [title, scrap, validateTitle, showTitleError, onTitleChange],
  );

  // フォーカスイベントハンドラ
  const handleTitleFocus = useCallback((): void => {
    setIsEditingTitle(true);
  }, []);

  // フォーカスがハズレた場合にファイル名を更新する
  const handleTitleBlur = useCallback((): void => {
    if (isCancelling) {
      console.log('blur発火 - キャンセル中のためスキップ');
      return;
    }

    console.log('blur発火 - タイトル検証開始');
    console.log('Current title for blur:', title);

    // タイトルが空の場合はblurを阻止してフォーカスを戻す
    if (!validateTitle(title)) {
      console.log('タイトルが空のためblur処理を阻止');
      showTitleError();
      return;
    }

    console.log('blur発火 - タイトル確定処理実行');
    confirmTitleChange();
  }, [confirmTitleChange, isCancelling, title, validateTitle, showTitleError]);

  // タイトル変更処理（リアルタイム表示 + エラー状態リセット）
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newTitle = e.target.value;
      setTitle(newTitle);

      // 入力があればエラー状態をリセット
      if (titleError && newTitle.trim().length > 0) {
        setTitleError(false);
      }

      console.log('Title changed:', newTitle);
    },
    [titleError],
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
          placeholder="タイトルを入力してください（必須）"
          className={`scrap-title-input ${titleError ? 'error' : ''}`}
        />
        {titleError && (
          <div className="title-error-message">タイトルは必須入力です</div>
        )}
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

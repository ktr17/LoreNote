import React, { useMemo, useCallback } from 'react';
import SimpleMde from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import type { Options } from 'easymde';

// Markdownエディタ用のモジュール
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const MarkdownEditor = ({
  value,
  onChange,
  placeholder = 'ここに内容を入力してください',
}: MarkdownEditorProps): JSX.Element => {
  const handleChange = (val: string): void => {
    onChange(val);
  };

  // CodeMirrorインスタンス取得時に内部dropイベントを無効化
  const getCmInstance = useCallback((cm: CodeMirror.Editor) => {
    if (!cm) return;

    // CodeMirrorの内部イベントで阻止
    cm.on('drop', (cmInstance, e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    });

    cm.on('dragover', (cmInstance, e: Event) => {
      e.preventDefault();
    });
  }, []);

  const editorOptions = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
      placeholder: placeholder,
      status: false,
      toolbar: false,
    } as Options;
  }, [placeholder]);

  return (
    <div
      className="markdown-editor"
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }}
    >
      <SimpleMde
        value={value}
        onChange={handleChange}
        options={editorOptions}
        getCodemirrorInstance={(editor) => {
          getCmInstance(editor);
          return editor;
        }}
      />
    </div>
  );
};

export default MarkdownEditor;

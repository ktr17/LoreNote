import React, { useMemo } from 'react';

// Markdownエディタ用のモジュール
import SimpleMde from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import type { Options } from 'easymde';

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
  const editorOptions = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
      placeholder: placeholder,
      status: false,
      toolbar: false,
    } as Options;
  }, [placeholder]);

  const handleChange = (value: string): void => {
    onChange(value);
  };

  return (
    <div className="markdown-editor">
      <SimpleMde
        value={value}
        onChange={handleChange}
        options={editorOptions}
      />
    </div>
  );
};

export default MarkdownEditor;

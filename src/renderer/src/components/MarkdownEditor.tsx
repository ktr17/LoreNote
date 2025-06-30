import React, { useMemo, useEffect } from 'react'

// Markdownエディタ用のモジュール
import SimpleMde from 'react-simplemde-editor'
import 'easymde/dist/easymde.min.css'
import type { Options } from 'easymde'
import useSettingViewModel from '../viewmodel/useSettingViewModel';


interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxEditorHeight: number;
}

export const MarkdownEditor = ({
  value,
  onChange,
  placeholder = 'ここに内容を入力してください',
  maxEditorHeight,
}: MarkdownEditorProps): JSX.Element => {
  console.log('📦 MarkdownEditor render:', maxEditorHeight);

  const editorOptions = useMemo(() => {
    console.log('editorOptions updated:', maxEditorHeight);

    return {
      autofocus: false,
      spellChecker: false,
      placeholder: placeholder,
      status: false,
      toolbar: false,
      maxHeight: `${maxEditorHeight}px`,
    } as Options
  }, [placeholder, maxEditorHeight])
  useEffect(() => {
    console.log('エディタ側で受け取った maxEditorHeight:', maxEditorHeight);
  }, [maxEditorHeight]);
  const handleChange = (value: string): void => {
    onChange(value)
  }

  return (
    <div className="markdown-editor">
      <SimpleMde value={value} onChange={handleChange} options={editorOptions} />
    </div>
  )
}

export default MarkdownEditor

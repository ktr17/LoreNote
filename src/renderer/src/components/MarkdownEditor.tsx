import { useMemo, useCallback, useRef, useEffect } from 'react';
import SimpleMde from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import type { Options } from 'easymde';
import useEditorSetting from '../hooks/useEditorSetting';

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
  const { editorHeight } = useEditorSetting();
  const cmRef = useRef<CodeMirror.Editor | null>(null);
  console.log('📏 editorHeight in MarkdownEditor:', editorHeight);

  const handleChange = (val: string): void => {
    onChange(val);
  };

  // CodeMirrorインスタンス取得時に内部dropイベントを無効化
  const getCmInstance = useCallback((cm: CodeMirror.Editor) => {
    if (!cm) return;

    cmRef.current = cm;

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
      minHeight: `${editorHeight}px`,
    } as Options;
  }, [placeholder, editorHeight]);

  useEffect(() => {
    if (cmRef.current) {
      cmRef.current.setSize(null, `${editorHeight}px`);
    }
  }, [editorHeight]);

  return (
    <div
      className="markdown-editor h-[var(--editor-height)]"
      style={{ height: `${editorHeight}px` }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }}
    >
      <SimpleMde
        key="markdown-editor"
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

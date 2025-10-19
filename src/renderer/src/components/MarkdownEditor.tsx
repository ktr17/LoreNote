import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
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
  const simpleMdeRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const cmRef = useRef<CodeMirror.Editor | null>(null);

  console.log('📏 Current editorHeight:', editorHeight);

  const handleChange = (val: string): void => {
    onChange(val);
  };

  const editorOptions = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
      placeholder: placeholder,
      status: false,
      toolbar: false,
    } as Options;
  }, [placeholder]);

  // エディタの高さを変更する関数
  const updateEditorHeight = useCallback((height: number) => {
    console.log('📐 updateEditorHeight called with:', height);

    if (simpleMdeRef.current?.simpleMDE) {
      const editor = simpleMdeRef.current.simpleMDE;
      const codemirror = editor.codemirror;

      if (codemirror) {
        console.log('📐 Applying height to CodeMirror:', height);

        // CodeMirrorのサイズを設定
        codemirror.setSize(null, height);

        // DOM要素にも直接適用
        const wrapper = codemirror.getWrapperElement();
        if (wrapper) {
          wrapper.style.height = `${height}px`;
          console.log('📐 Set wrapper height:', wrapper.style.height);
        }

        const scrollElement = codemirror.getScrollerElement();
        if (scrollElement) {
          scrollElement.style.height = `${height}px`;
          console.log('📐 Set scroller height:', scrollElement.style.height);
        }

        // 親のCodeMirror要素も確認
        const codeMirrorElement = wrapper?.querySelector(
          '.CodeMirror',
        ) as HTMLElement;
        if (codeMirrorElement) {
          codeMirrorElement.style.height = `${height}px`;
          console.log(
            '📐 Set CodeMirror element height:',
            codeMirrorElement.style.height,
          );
        }

        // refresh を複数回実行
        codemirror.refresh();
        setTimeout(() => {
          codemirror.refresh();
          console.log('📐 Delayed refresh completed');
        }, 100);

        return true;
      }
    }
    console.log('📐 Failed to update height - editor not ready');
    return false;
  }, []);

  // エディタが作成された時の処理
  const handleEditorCreated = useCallback(() => {
    console.log('🏗️ Editor created callback');
    setIsEditorReady(true);

    // 初期高さを設定
    setTimeout(() => {
      updateEditorHeight(editorHeight);
    }, 50);
  }, [editorHeight, updateEditorHeight]);

  // 高さが変更された時の処理
  useEffect(() => {
    console.log(
      '📐 Height effect triggered:',
      editorHeight,
      'isReady:',
      isEditorReady,
    );

    if (isEditorReady) {
      const success = updateEditorHeight(editorHeight);
      if (!success) {
        // 失敗した場合は少し待ってリトライ
        setTimeout(() => {
          console.log('📐 Retrying height update');
          updateEditorHeight(editorHeight);
        }, 200);
      }
    }
  }, [editorHeight, isEditorReady, updateEditorHeight]);

  // getCodemirrorInstance でもバックアップとして設定
  const getCmInstance = useCallback(
    (cm: CodeMirror.Editor) => {
      console.log('🔧 getCmInstance called');

      if (!cm) return;

      cmRef.current = cm;

      // CodeMirrorインスタンス取得時に内部dropイベントを無効化
      cm.on('drop', (_, e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      });
      cm.on('dragover', (_, e: Event) => {
        e.preventDefault();
      });

      if (cm) {
        // 直接CodeMirrorインスタンスでも試す
        setTimeout(() => {
          cm.setSize(null, editorHeight);
          cm.refresh();
          console.log('🔧 Height set via getCmInstance:', editorHeight);
        }, 10);
      }
    },
    [editorHeight],
  );

  return (
    <div
      className="markdown-editor"
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
        ref={simpleMdeRef}
        key="markdown-editor"
        value={value}
        onChange={handleChange}
        options={editorOptions}
        getCodemirrorInstance={getCmInstance}
        events={{
          'after-editor-created': handleEditorCreated,
        }}
      />
    </div>
  );
};

export default MarkdownEditor;

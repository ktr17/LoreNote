import { useSyncExternalStore, useEffect } from 'react';
import sharedSettingViewModel from '../viewmodel/SettingViewModel';

export const useEditorSetting = () => {
  useEffect(() => {
    // メインプロセス経由の高さ更新を受信
    const heightUpdateHandler = (height: number) => {
      console.log('🎯🎯🎯 send-height-updated 受信!!! height=', height);
      sharedSettingViewModel.setMaxEditorHeight(height);
    };
    window.api.project.onHeightUpdated(heightUpdateHandler);

    return () => {
      window.api.project.offHeightUpdated(heightUpdateHandler);
    };
  }, []);
  // useSyncExternalStoreでViewModelと同期
  const editorHeight = useSyncExternalStore(
    // subscribe関数：値が変わったら通知を受け取る
    (callback) => {
      console.log('editorHeightの値：' + editorHeight);
      return sharedSettingViewModel.subscribe(callback);
    },
    // getSnapshot関数：現在の値を取得
    () => {
      const currentValue = sharedSettingViewModel.maxEditorHeight;
      console.log('getSnapshot返す値:', currentValue); // デバッグ
      return currentValue;
    },
  );
  /**
   * エディタの高さを通知する処理
   */
  const setEditorHeight = (value: number) => {
    // 有効な値のみ保存
    if (value && value > 0) {
      window.api.project.notifyEditorHeight(value);
    }
  };
  return {
    editorHeight,
    setEditorHeight,
  };
};

export default useEditorSetting;

import { useSyncExternalStore } from 'react';
import settingViewModel from './SettingViewModel';

export const useSettingViewModel = () => {
  const maxEditorHeight = useSyncExternalStore(
    settingViewModel.subscribe.bind(settingViewModel),
    () => settingViewModel.maxEditorHeight
  );

  console.log('🧠 useSettingViewModel - maxEditorHeight:', maxEditorHeight);

  return {
    maxEditorHeight,
    setMaxEditorHeight: settingViewModel.setMaxEditorHeight.bind(settingViewModel),
    // todo ちゃんとここで値を設定できるようになってるのかな？
  };
};

export default useSettingViewModel;

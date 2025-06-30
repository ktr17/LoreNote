import SettingModel from '../model/SettingModel';

class SettingViewModel {
  private model: SettingModel;

  constructor(model: SettingModel) {
    this.model = model;
  }

  get maxEditorHeight(): number {
    return this.model.maxEditorHeight;
  }

  setMaxEditorHeight(value: number) {
    this.model.maxEditorHeight = value;
  }

  subscribe = (callback: () => void): (() => void) => {
    return this.model.subscribe(callback);
  };
}

// ✅ シングルトンとしてエクスポート
const sharedSettingViewModel = new SettingViewModel(SettingModel);
export default sharedSettingViewModel;

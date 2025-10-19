class SettingModel {
  private _maxEditorHeight: number = 200;

  private listeners = new Set<() => void>();
  /**
   * 現在のエディタの高さ設定値を取得する
   */
  get maxEditorHeight(): number {
    return this._maxEditorHeight;
  }

  /**
   * エディタの高さの設定値を上書きする
   */
  set maxEditorHeight(value: number) {
    // 現在の設定値と異なっていれば、上書きする
    if (this._maxEditorHeight !== value) {
      this._maxEditorHeight = value;
      this.emitChange();
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);

    // 即時通知で初期値も反映されるように
    callback();

    return () => this.listeners.delete(callback);
  }

  private emitChange(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

const sharedSettingModel = new SettingModel();
export default sharedSettingModel;

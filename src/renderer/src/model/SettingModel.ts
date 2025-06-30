class SettingModel {
  private _maxEditorHeight: number = 400; // todo この値が変わらないんですよね。

  private listeners = new Set<() => void>();
  private _count: number = 0;
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
      console.log("高さを表示" + this._maxEditorHeight);
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    console.log("サブスクライブです" + this._maxEditorHeight);

    // 即時通知で初期値も反映されるように
    callback();

    return () => this.listeners.delete(callback);
  }

  private emitChange(): void {
    for (const listener of this.listeners) {
      console.log(`listenerの名前： ${listener}`)
      listener();
    }
  }
}

const sharedSettingModel = new SettingModel();
export default sharedSettingModel;

class SettingViewModel {
  private _maxEditorHeight: number = 500; // デフォルト値を設定
  private listeners = new Set<() => void>();

  constructor() {
    // 起動時にファイルから読み込む
    this.loadEditorHeight();
  }

  async getMaxEditorHeight(): Promise<number> {
    try {
      const resultGetEditorHeight = await window.api.project.getEditorHeight();
      if (resultGetEditorHeight != null) {
        return resultGetEditorHeight;
      }
      return 0;
    } catch (error) {
      console.error('高さ取得エラー:', error);
      return this._maxEditorHeight;
    }
  }

  /**
   * 現在の値を取得（同期的）
   */
  get maxEditorHeight(): number {
    return this._maxEditorHeight;
  }

  /**
   * エディタの高さを設定して保存
   */
  async setMaxEditorHeight(value: number): Promise<void> {
    console.log('setMaxEditorHeight called with:', value);

    this._maxEditorHeight = value;
    this.emitChange();
    try {
      await window.api.project.saveEditorHeight(value);
      console.log(
        'ファイルに保存する処理をデバッグのため、停止しています:',
        value,
      );
    } catch (error) {
      console.error('保存エラー:', error);
    }
  }

  /**
   * ファイルから読み込み（初回のみ）
   */
  private async loadEditorHeight(): Promise<void> {
    try {
      const height = await window.api.project.getEditorHeight();
      if (height != null && typeof height === 'number') {
        this._maxEditorHeight = height;
        this.emitChange(); // ← 読み込み後に通知
        console.log('エディタの高さを読み込みました:', height);
      }
    } catch (error) {
      console.error('読み込みエラー:', error);
      // エラーの場合はデフォルト値を使用
      this._maxEditorHeight = 500;
    }
  }

  /**
   * Subscribe関数
   */
  subscribe(callback: () => void): () => void {
    console.log('subscribe called, current listeners:', this.listeners.size);
    this.listeners.add(callback);

    callback();

    return () => {
      console.log('unsubscribe called');
      this.listeners.delete(callback);
    };
  }

  /**
   * イベント通知関数
   */
  private emitChange(): void {
    console.log(
      'emitChange called, notifying',
      this.listeners.size,
      'listeners',
    );
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.error('Listener error:', error);
      }
    }
  }
}

const sharedSettingViewModel = new SettingViewModel();
export default sharedSettingViewModel;

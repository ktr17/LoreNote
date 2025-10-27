// vitest.setup.ts
import '@testing-library/jest-dom';

global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe(target) {
    // 必要に応じて初期サイズを通知
    this.callback([
      {
        target,
        contentRect: {
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          bottom: 100,
          right: 100,
        },
      },
    ]);
  }

  unobserve() {}
  disconnect() {}
};

// vitest.setup.ts
import '@testing-library/jest-dom';
import { mockAnimationsApi } from 'jsdom-testing-mocks';

mockAnimationsApi();

global.ResizeObserver = class ResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    const entry: ResizeObserverEntry = {
      target,
      contentRect: {
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      } as DOMRectReadOnly,
    } as ResizeObserverEntry;

    this.callback([entry], this);
  }

  unobserve() {}
  disconnect() {}
};

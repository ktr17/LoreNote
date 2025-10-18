export {};

declare global {
  interface Window {
    api: (typeof import('../preload/preload'))['api'];
  }
}

// export {};

// declare global {
//   interface Window {
//     api: (typeof import('../preload/preload')).['api'];
//   }
// }

// src/renderer/src/global.d.ts
export {};

declare global {
  interface Window {
    api: import('../preload/preload').api;
  }
}

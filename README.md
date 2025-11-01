# Lore Note

## Overview

📘 LoreNote – 学びを、知識に変えるメモアプリ

**LoreNote**は、エンジニアのためのナレッジ蓄積アプリです。
学んだことを"使える形"で残し、思考をクリアに保ちます。

コンセプト：1つのメモに、1つのナレッジ

- **小さな単位で記録** – 情報の整理が圧倒的にラクになる
- **自由に並び替え** – 思考の流れに合わせて構造化できる
- **Markdown対応** – すべてのメモは1ファイルごとに保存され、そのまま技術ドキュメントとして使える

シンプルだから、続けられる。続けるから、知識になる。

<img width="1804" height="1344" alt="CleanShot 2025-11-01 at 17 16 34@2x" src="https://github.com/user-attachments/assets/2b88dffa-f7ee-4f92-8ecd-ba2992d3a958" />


## Project Setup

### Install

```bash
$ yarn install
```

### Development

```bash
$ yarn dev
```

### Build

```bash
# For windows
$ yarn build:win

# For macOS
$ yarn build:mac

# For Linux
$ yarn build:linux
```

### Recommend install

```bash
curl https://get.volta.sh | bash
volta install node@22.13.1
volta pin node@22.13.1
```

## Test

| Layer    | Test Type       | Tool                             |
| -------- | --------------- | -------------------------------- |
| Renderer | 単体・UIテスト  | **Vitest** + **Testing Library** |
| Renderer | コンポーネント  | **@testing-library/react**       |
| Preload  | 単体テスト      | **Vitest**                       |
| Main     | 単体/統合テスト | **Vitest**                       |

### テスト実行コマンド

```bash
yarn test
```

## Folder structure

```
.
└── src/
    ├── main/
    │   └── index.ts: Main Process
    ├── renderer/
    │   └── src/
    │       ├── component
    │       ├── model
    │       ├── viewmodel
    │       ├── assets
    │       └── App.tsx: Renderer Process
    └── preload/
        └── preload.ts: Preload Process
```

[tree.nathanfriend.com
](<https://tree.nathanfriend.com/?s=(%27options!(%27fancy3~fullPath!false~trailingSlash3~rootDot3)~5(%275%27src-main0Main2r6-*src4component48view8assets4App.tsx7R62preload0Preload9%27)~version!%271%27)*%20%20-9*0-*index.ts72%20Process-3!true4-**5source!6enderer7%3A%208model49%5Cn%01987654320-*>)

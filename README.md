# Lore Note
## Overview

📘 LoreNote – 学びを、知識に変えるメモアプリ
LoreNoteは、あなたのナレッジを“使える形”で蓄積する、エンジニアのための知識メモアプリです。シンプルだから、頭の中もスッキリ。
コンセプトは、「1つのメモに、1つのナレッジ」。

学んだことを**小さな塊**で記録するため、情報の整理・検索が圧倒的にラク。

メモは自由に並び替え可能。思考の流れに合わせて構造化も簡単。

すべてのメモはMarkdown対応・1ファイルごとに保存。そのまま技術ドキュメントにも使えます。

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

| Layer        | Test Type  | Tool                                     |
| -------- | -------- | ----------------------------------------- |
| Renderer | 単体・UIテスト | **Vitest** + **Testing Library**          |
| Renderer | コンポーネント  | **@testing-library/react**                |
| Preload  | 単体テスト    | **Vitest**                                |
| Main     | 単体/統合テスト | **Vitest**                 |
<!-- | E2E（統合）  | 実行時シナリオ  | **Playwright** or **Spectron**（Electron用） | -->

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
](https://tree.nathanfriend.com/?s=(%27options!(%27fancy3~fullPath!false~trailingSlash3~rootDot3)~5(%275%27src-main0Main2r6-*src4component48view8assets4App.tsx7R62preload0Preload9%27)~version!%271%27)*%20%20-9*0-*index.ts72%20Process-3!true4-**5source!6enderer7%3A%208model49%5Cn%01987654320-*)


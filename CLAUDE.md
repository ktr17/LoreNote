# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LoreNote is a knowledge management application for engineers built with Electron, React, and TypeScript. It follows the principle of "one note, one piece of knowledge" - allowing users to store small units of information as individual markdown files, freely reorder them, and organize their learning.

## Development Commands

### Setup
```bash
yarn install
```

### Running the Application
```bash
# Development mode with hot reload
yarn dev

# Start built application
yarn start
```

### Building
```bash
# Type checking
yarn typecheck              # Check both node and web
yarn typecheck:node         # Main/Preload process only
yarn typecheck:web          # Renderer process only

# Build for distribution
yarn build:mac              # macOS
yarn build:win              # Windows
yarn build:linux            # Linux
yarn build:unpack           # Build without packaging (for testing)
```

### Testing
```bash
yarn test                   # Run all tests
yarn test:ui                # Run tests with Vitest UI
yarn test src/renderer/src/components/Setting.test.tsx  # Run single test file
```

### Code Quality
```bash
yarn lint                   # ESLint check
yarn format                 # Format code with Prettier
```

## Architecture

### Three-Process Electron Architecture

**Main Process** (`src/main/index.ts`):
- Manages application lifecycle and windows (main: 900x670, settings: 600x400)
- Handles IPC communication with ~25 handlers organized by domain (`file.*`, `scrap.*`, `project.*`, `dialog.*`)
- Implements two-layer storage:
  - Settings: `~/.lorenote/setting.json` via electron-store (projects, save interval, UI preferences)
  - Per-project: `{projectPath}/scraps.json` (note metadata) + individual `.md` files (content)
- Uses fractional ordering (lines 72-88) for efficient drag-and-drop without mass updates

**Preload Script** (`src/preload/preload.ts`):
- Security bridge exposing scoped API to renderer via `window.api`
- Namespaces: `file`, `scrap`, `project`, `navigation`, `dialog`
- Implements proper cleanup for IPC event listeners to prevent memory leaks

**Renderer Process** (`src/renderer/`):
- React 18 application with MVVM pattern
- HashRouter for navigation (`/` main view, `/setting` settings modal)
- No Redux/Zustand - uses custom ViewModels with `useSyncExternalStore` for shared state

### MVVM Pattern Implementation

**Model** (`src/renderer/src/model/`):
- `ScrapModel.ts`: Domain entity for notes (id, content, title, order)
- `SettingModel.ts`: Settings domain model
- Uses UUID v4 for unique identification

**ViewModel** (`src/renderer/src/viewmodel/`):
- `ScrapViewModel.ts` (370 lines): Primary business logic hub
  - Custom hook `useScrapViewModel()` managing note collection state
  - Auto-save with lodash.debounce (configurable interval, min 5s)
  - Implements fractional ordering for drag-and-drop
  - Extracts title from markdown H1 headers
  - Handles file import from project folder

- `SettingViewModel.ts`: Shared settings state
  - Singleton pattern via `getSharedSettingViewModel()`
  - Observer pattern with Set of listeners
  - Syncs across windows via IPC + `useSyncExternalStore`

**View/Components** (`src/renderer/src/components/`):
- `App.tsx`: Root component with project switcher and drag-and-drop orchestration
- `Scrap.tsx` (316 lines): Individual note card
  - Complex title editing with IME composition handling
  - Validation: non-empty titles, generates "Untitled N" fallback
  - Inline editing (Escape=cancel, Enter=confirm)
- `MarkdownEditor.tsx`: EasyMDE wrapper with dynamic height
- `Setting.tsx` (642 lines): Settings modal with project CRUD, save interval, editor height config

### Data Flow Patterns

**Note Creation:**
1. User clicks "Add Memo" → `ScrapViewModel.addScrap()`
2. Generate UUID, assign order number
3. Create file `{projectPath}/{title}.md` + update `scraps.json`
4. Update React state → re-render

**Auto-Save (Debounced):**
1. User types → `onChange` → `handleContentChange`
2. Update ViewModel → debounced save (after configured interval)
3. Write to `{title}.md` and update `scraps.json`

**Project Switching:**
1. Select project from dropdown → IPC `setCurrentProject(projectId)`
2. Main process updates `currentProjectId`, resets `scrapsStore`
3. Renderer reloads → loads notes from new project's `scraps.json`

**Cross-Window Sync (e.g., editor height):**
1. Settings window changes value → `notifyEditorHeight(height)`
2. Main process broadcasts to all windows
3. `SettingViewModel` receives update → `useSyncExternalStore` triggers re-render

### Multiple Project Support

Recent feature (Issue #37) enabling users to manage multiple project folders:
- Projects stored as array with UUID, name, and path
- `currentProjectId` tracks active project
- Backward compatibility: `migrateToMultipleProjects()` function (src/main/index.ts:169-197)
- Switching projects resets `scrapsStore` and reloads renderer

## Key Technical Decisions

1. **File-based storage over database**: Markdown files are portable, Git-friendly, and human-readable
2. **Fractional ordering**: Calculate order as average between neighbors - enables drag-and-drop without reordering all items
3. **Singleton ViewModels**: Shared state across components without prop drilling or external state library
4. **HashRouter**: Works with Electron's `file://` protocol
5. **Auto-save with debouncing**: Balance between data safety and performance (minimum 5 seconds)
6. **IME composition handling**: `isComposing` check in Scrap.tsx prevents premature form submission for Japanese/Chinese input

## Testing Strategy

**Current Coverage:**
- Renderer: 3 component tests (Setting, ConfirmDialog, DropdownMenu)
- Main/Preload: No tests currently

**Test Patterns:**
- Use Vitest + @testing-library/react for renderer components
- Mock `window.api` for IPC calls in tests
- Mock `useNavigate` for routing tests
- Example: `src/renderer/src/components/Setting.test.tsx`

**Running Single Test:**
```bash
yarn test src/renderer/src/components/Setting.test.tsx
```

## Important Code Locations

**IPC Handlers:**
- Main process handlers: `src/main/index.ts` (lines ~110-730)
- Preload API definitions: `src/preload/preload.ts`

**State Management:**
- Note state: `src/renderer/src/viewmodel/ScrapViewModel.ts`
- Settings state: `src/renderer/src/viewmodel/SettingViewModel.ts` (singleton)

**File Operations:**
- Read/Write markdown: `src/main/index.ts` (file.* handlers)
- Note metadata: `src/main/index.ts` (scrap.* handlers)

**Drag and Drop:**
- Order calculation: `src/main/index.ts:72-88` (calculateNewOrder function)
- UI orchestration: `src/renderer/src/components/App.tsx`

**Project Migration:**
- Single→Multiple projects: `src/main/index.ts:169-197` (migrateToMultipleProjects)

## Common Development Patterns

**Adding a new IPC handler:**
1. Add handler in `src/main/index.ts`: `ipcMain.handle('domain.action', async (event, ...args) => { ... })`
2. Expose in `src/preload/preload.ts`: Add method to appropriate namespace in `contextBridge.exposeInMainWorld`
3. Use in renderer: `await window.api.domain.action(...args)`

**Adding a new setting:**
1. Add to `SettingModel` type
2. Add getter/setter in `src/main/index.ts` IPC handlers (`project.saveSetting`, `project.getSetting`)
3. Update `src/renderer/src/components/Setting.tsx` UI
4. Access via `SettingViewModel` in components

**Creating a new component with tests:**
1. Create component in `src/renderer/src/components/`
2. Create test file: `ComponentName.test.tsx`
3. Mock `window.api` methods used by component
4. Use `@testing-library/react` utilities (render, screen, fireEvent, waitFor)

## TypeScript Configuration

- `tsconfig.node.json`: Main and Preload processes (Node.js environment)
- `tsconfig.web.json`: Renderer process (DOM environment)
- Path alias: `@renderer` → `src/renderer/src` (configured in `electron.vite.config.ts:16`)

## Build Configuration

- **electron-vite**: Orchestrates Vite builds for all three processes
- **electron-builder**: Packages application for distribution
- Config files: `electron.vite.config.ts`, `electron-builder.yml`
- Icons: `build/icon.icns` (macOS), `build/icon.ico` (Windows)

## Dependencies of Note

- `electron-store`: Settings and metadata persistence
- `react-simplemde-editor` / `easymde`: Markdown editor (CodeMirror-based)
- `marked`: Markdown parsing
- `dompurify`: XSS prevention for rendered markdown
- `highlight.js`: Code syntax highlighting
- `lodash.debounce`: Auto-save throttling
- `uuid`: Unique identifiers for notes
- `@headlessui/react`: Unstyled accessible UI components

## Security Considerations

- Context isolation enabled (`contextIsolation: true`)
- Node integration disabled in renderer (`nodeIntegration: false`)
- All IPC communication through preload script's scoped API
- Markdown rendering sanitized with DOMPurify to prevent XSS
- No direct filesystem access from renderer - all operations via IPC

## Node Version

Managed via Volta (recommended):
```bash
curl https://get.volta.sh | bash
volta install node@22.13.1
volta pin node@22.13.1
```

Current pinned version: **Node 22.13.1**, Yarn 4.6.0

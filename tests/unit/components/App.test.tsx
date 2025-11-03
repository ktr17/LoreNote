import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../../src/renderer/src/App';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// react-router-domのモック
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// ScrapViewModelのモック
vi.mock('../../../src/renderer/src/viewmodel/ScrapViewModel', () => ({
  default: vi.fn(() => ({
    scraps: [],
    selectedScrapId: 0,
    setSelectedScrapId: vi.fn(),
    addScrap: vi.fn(),
    updateScrapContent: vi.fn(),
    updateScrapTitle: vi.fn(),
    reorderScraps: vi.fn(),
    deleteScrap: vi.fn(),
    addScrapFromFile: vi.fn(),
    openProjectFiles: vi.fn(),
  })),
}));

describe('App - Sidebar and HamburgerMenu Integration', () => {
  const mockProjects = [
    { id: '1', name: 'プロジェクト1', path: '/path/to/project1' },
    { id: '2', name: 'プロジェクト2', path: '/path/to/project2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // window.apiのモック
    window.api = {
      project: {
        getProjects: vi.fn().mockResolvedValue(mockProjects),
        getCurrentProject: vi.fn().mockResolvedValue(mockProjects[0]),
        setCurrentProject: vi.fn().mockResolvedValue(true),
        getPath: vi.fn().mockResolvedValue('/mock/path'),
        getInterval: vi.fn().mockResolvedValue(10),
        getEditorHeight: vi.fn().mockResolvedValue(90),
      },
      navigation: {
        onNavigateToSetting: vi.fn(),
        offNavigateToSettingListener: vi.fn(),
      },
      scrap: {
        loadJson: vi.fn().mockResolvedValue([]),
        updateOrder: vi.fn().mockResolvedValue(true),
      },
      file: {
        save: vi.fn().mockResolvedValue({ filePath: '/mock/file.md' }),
      },
    } as any;
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('初期表示でサイドバーが閉じており、ハンバーガーメニューが表示される', async () => {
    renderWithRouter(<App />);

    // ハンバーガーメニューが表示されている
    const hamburgerButton = screen.getByRole('button', { name: 'メニュー' });
    expect(hamburgerButton).toBeInTheDocument();

    // サイドバーは画面外（左側に隠れている）
    await waitFor(() => {
      const sidebar = document.querySelector('div[style*="left: -280px"]');
      expect(sidebar).toBeInTheDocument();
    });
  });

  it('ハンバーガーメニューをクリックするとサイドバーが開く', async () => {
    renderWithRouter(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'メニュー' })).toBeInTheDocument();
    });

    const hamburgerButton = screen.getByRole('button', { name: 'メニュー' });
    fireEvent.click(hamburgerButton);

    // サイドバーが表示される（left: 0）
    await waitFor(() => {
      const sidebar = document.querySelector('div[style*="left: 0"]');
      expect(sidebar).toBeInTheDocument();
    });

    // サイドバー内のヘッダーが表示される
    await waitFor(() => {
      expect(screen.getByText('プロジェクト')).toBeInTheDocument();
    });
  });

  it('サイドバーが開いているときはハンバーガーメニューが非表示になる', async () => {
    renderWithRouter(<App />);

    // 初期状態でハンバーガーメニューが表示されている
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'メニュー' })).toBeInTheDocument();
    });

    const hamburgerButton = screen.getByRole('button', { name: 'メニュー' });
    fireEvent.click(hamburgerButton);

    // サイドバーが開いたらハンバーガーメニューが非表示になる
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'メニュー' })).not.toBeInTheDocument();
    });
  });

  it('サイドバーの閉じるボタンをクリックするとサイドバーが閉じてハンバーガーメニューが表示される', async () => {
    renderWithRouter(<App />);

    // ハンバーガーメニューをクリックしてサイドバーを開く
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'メニュー' })).toBeInTheDocument();
    });

    const hamburgerButton = screen.getByRole('button', { name: 'メニュー' });
    fireEvent.click(hamburgerButton);

    // サイドバーが表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByText('プロジェクト')).toBeInTheDocument();
    });

    // 閉じるボタンをクリック
    const closeButton = screen.getByRole('button', { name: '閉じる' });
    fireEvent.click(closeButton);

    // サイドバーが閉じる（画面外に移動）
    await waitFor(() => {
      const sidebar = document.querySelector('div[style*="left: -280px"]');
      expect(sidebar).toBeInTheDocument();
    });

    // ハンバーガーメニューが再表示される
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'メニュー' })).toBeInTheDocument();
    });
  });

  it('サイドバーのプロジェクトリストが表示される', async () => {
    renderWithRouter(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'メニュー' })).toBeInTheDocument();
    });

    const hamburgerButton = screen.getByRole('button', { name: 'メニュー' });
    fireEvent.click(hamburgerButton);

    // プロジェクトリストが表示される
    await waitFor(() => {
      mockProjects.forEach((project) => {
        expect(screen.getByText(project.name)).toBeInTheDocument();
      });
    });
  });

  it('オーバーレイをクリックするとサイドバーが閉じる', async () => {
    renderWithRouter(<App />);

    // サイドバーを開く
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'メニュー' })).toBeInTheDocument();
    });

    const hamburgerButton = screen.getByRole('button', { name: 'メニュー' });
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(screen.getByText('プロジェクト')).toBeInTheDocument();
    });

    // オーバーレイを探す
    const overlays = document.querySelectorAll('div');
    const overlay = Array.from(overlays).find((div) =>
      div.style.backgroundColor === 'rgba(0, 0, 0, 0.5)'
    );

    expect(overlay).toBeTruthy();
    fireEvent.click(overlay!);

    // サイドバーが閉じる
    await waitFor(() => {
      const sidebar = document.querySelector('div[style*="left: -280px"]');
      expect(sidebar).toBeInTheDocument();
    });

    // ハンバーガーメニューが再表示される
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'メニュー' })).toBeInTheDocument();
    });
  });

  it('メモを追加ボタンが表示される', async () => {
    renderWithRouter(<App />);

    await waitFor(() => {
      expect(screen.getByText('メモを追加')).toBeInTheDocument();
    });
  });

  it('LoreNoteタイトルが表示される', async () => {
    renderWithRouter(<App />);

    await waitFor(() => {
      expect(screen.getByText('LoreNote')).toBeInTheDocument();
    });
  });
});

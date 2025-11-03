import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Setting from '../../../src/renderer/src/components/Setting';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// useNavigateをモック
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// useEditorSettingをモック
vi.mock('../../../src/renderer/src/hooks/useEditorSetting', () => ({
  default: vi.fn(() => ({
    editorHeight: 90,
    setEditorHeight: vi.fn(),
    saveEditorHaight: vi.fn().mockResolvedValue(true),
  })),
}));

describe('Setting Component', () => {
  let mockNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // navigateのモック
    mockNavigate = vi.fn();
    (useNavigate as any).mockReturnValue(mockNavigate);

    // window.apiのモック
    window.api = {
      project: {
        getProjects: vi.fn().mockResolvedValue([]),
        getCurrentProject: vi.fn().mockResolvedValue(null),
        getInterval: vi.fn().mockResolvedValue(10),
        getEditorHeight: vi.fn().mockResolvedValue(90),
        addProject: vi.fn().mockResolvedValue({
          id: 'new-project-id',
          name: 'New Project',
          path: '/new/project/path',
        }),
        removeProject: vi.fn().mockResolvedValue(true),
        setCurrentProject: vi.fn().mockResolvedValue(true),
        updateProject: vi.fn().mockResolvedValue(true),
        saveInterval: vi.fn().mockResolvedValue(true),
        saveEditorHeight: vi.fn().mockResolvedValue(true),
        onHeightUpdated: vi.fn((callback) => {
          return () => {};
        }),
        offHeightUpdated: vi.fn((callback) => {
          return () => {};
        }),
        notifyEditorHeight: vi.fn(),
      },
      dialog: {
        openFolder: vi
          .fn()
          .mockResolvedValue({ canceled: false, folderPath: '/selected/folder' }),
      },
    } as any;
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('初期値が表示される', async () => {
    renderWithRouter(<Setting />);

    // APIが呼ばれることを確認
    expect(window.api.project.getProjects).toHaveBeenCalled();
    expect(window.api.project.getCurrentProject).toHaveBeenCalled();
    expect(window.api.project.getInterval).toHaveBeenCalled();

    // 非同期で値が表示されるのを待つ
    await waitFor(() => {
      const intervalInput = screen.getByLabelText('保存間隔');
      expect(intervalInput).toHaveValue(10);
    });

    await waitFor(() => {
      const heightInput = screen.getByLabelText('高さ');
      expect(heightInput).toHaveValue(90);
    });
  });

  it('適用ボタン押下で設定が保存される', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithRouter(<Setting />);

    // 入力フィールドが表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByLabelText('保存間隔')).toBeInTheDocument();
    });

    const button = screen.getByText('適用');
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.api.project.saveInterval).toHaveBeenCalledWith(10);
      expect(alertMock).toHaveBeenCalledWith('保存しました。');
    });

    alertMock.mockRestore();
  });

  it('戻るボタンでホーム画面に遷移する（プロジェクトがある場合）', async () => {
    // プロジェクトがある状態をモック
    window.api.project.getCurrentProject = vi.fn().mockResolvedValue({
      id: '1',
      name: 'Test Project',
      path: '/test/path',
    });

    renderWithRouter(<Setting />);

    await waitFor(() => {
      expect(screen.getByText('戻る')).toBeInTheDocument();
    });

    const backButton = screen.getByText('戻る');
    fireEvent.click(backButton);

    // navigate('/')が呼ばれることを確認
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('プロジェクトがない場合、戻るボタンでアラートが表示される', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithRouter(<Setting />);

    await waitFor(() => {
      expect(screen.getByText('戻る')).toBeInTheDocument();
    });

    const backButton = screen.getByText('戻る');
    fireEvent.click(backButton);

    // アラートが表示され、遷移しないことを確認
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        'プロジェクトが選択されていません。\nプロジェクトを追加して選択してください。',
      );
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    alertMock.mockRestore();
  });

  it('保存間隔が最小値以下を入力できない', async () => {
    renderWithRouter(<Setting />);

    const input = await screen.findByLabelText('保存間隔');
    fireEvent.change(input, { target: { value: '1' } });

    await waitFor(() => {
      expect(input).toHaveValue(5);
    });
  });

  it('エディタ高さの最小値以下を入力できない', async () => {
    renderWithRouter(<Setting />);

    const input = await screen.findByLabelText('高さ');
    fireEvent.change(input, { target: { value: '1' } });

    await waitFor(() => {
      expect(input).toHaveValue(50);
    });
  });

  it('フォルダ選択ボタンでパスが選択される', async () => {
    renderWithRouter(<Setting />);

    await waitFor(() => {
      expect(screen.getByText('選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(window.api.dialog.openFolder).toHaveBeenCalled();
    });
  });

  it('プロジェクト追加時に必須項目がない場合アラートが表示される', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithRouter(<Setting />);

    await waitFor(() => {
      expect(screen.getByText('追加')).toBeInTheDocument();
    });

    const addButton = screen.getByText('追加');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('プロジェクト名とパスを入力してください。');
    });

    alertMock.mockRestore();
  });
});

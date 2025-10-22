import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Setting from '../../../src/renderer/src/components/Setting';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

// useNavigateをモック
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

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
        getPath: vi.fn().mockResolvedValue('/mock/path'),
        getInterval: vi.fn().mockResolvedValue(10),
        getEditorHeight: vi.fn().mockResolvedValue(90),
        savePath: vi.fn().mockResolvedValue(true),
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
          .mockResolvedValue({ canceled: false, folderPath: '/new/path' }),
      },
    } as any;
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('初期値が表示される', async () => {
    renderWithRouter(<Setting />);

    // 正しい関数名で検証
    expect(window.api.project.getPath).toHaveBeenCalled();
    expect(window.api.project.getInterval).toHaveBeenCalled();
    expect(window.api.project.getEditorHeight).toHaveBeenCalled();

    // 非同期で値が表示されるのを待つ
    expect(await screen.findByDisplayValue('/mock/path')).toBeInTheDocument();
    expect(await screen.findByDisplayValue(10)).toBeInTheDocument();
    expect(await screen.findByDisplayValue(90)).toBeInTheDocument();
  });

  it('フォルダ選択ボタンでパスが変更される', async () => {
    renderWithRouter(<Setting />);

    await screen.findByDisplayValue('/mock/path');

    const button = screen.getByText('...');
    fireEvent.click(button);

    expect(window.api.dialog.openFolder).toHaveBeenCalled();
    expect(await screen.findByDisplayValue('/new/path')).toBeInTheDocument();
  });

  it('適用ボタン押下で設定が保存される', async () => {
    // alertをモック
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithRouter(<Setting />);

    await screen.findByDisplayValue('/mock/path');

    const button = screen.getByText('適用');
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.api.project.savePath).toHaveBeenCalledWith('/mock/path');
      expect(window.api.project.saveInterval).toHaveBeenCalledWith(10);
      expect(window.api.project.saveEditorHeight).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith('保存しました。');
    });

    alertMock.mockRestore();
  });

  it('戻るボタンでホーム画面に遷移する', async () => {
    renderWithRouter(<Setting />);

    await screen.findByDisplayValue('/mock/path');

    const backButton = screen.getByText('戻る');
    fireEvent.click(backButton);

    // navigate('/')が呼ばれることを確認
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('プロジェクトパスが空の場合、戻るボタンでアラートが表示される', async () => {
    // alertをモック
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    // 空のパスを返すようにモックを変更
    window.api.project.getPath = vi.fn().mockResolvedValue('');

    renderWithRouter(<Setting />);

    // 入力フィールドが表示されるまで待つ
    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs.length).toBeGreaterThan(0);
    });

    const backButton = screen.getByText('戻る');
    fireEvent.click(backButton);

    // アラートが表示され、遷移しないことを確認
    expect(alertMock).toHaveBeenCalledWith(
      'プロジェクトパスが空です。\nプロジェクトパスを入力してください。',
    );
    expect(mockNavigate).not.toHaveBeenCalled();

    alertMock.mockRestore();
  });

  it('入力値が変更できる', async () => {
    const user = userEvent.setup();

    renderWithRouter(<Setting />);

    // プロジェクトパスの変更
    const pathInput = await screen.findByDisplayValue('/mock/path');
    fireEvent.change(pathInput, { target: { value: '/new/custom/path' } });
    expect(screen.getByDisplayValue('/new/custom/path')).toBeInTheDocument();
    // 保存間隔の変更
    const intervalInput = screen.getByDisplayValue('10');
    fireEvent.change(intervalInput, { target: { value: '20' } });
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();

    // エディタ高さの変更
    const heightInput = screen.getByDisplayValue('90');
    fireEvent.change(heightInput, { target: { value: '120' } });
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
  });
});

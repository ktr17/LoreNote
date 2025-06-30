import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Setting from '../../../src/renderer/src/components/Setting';
import { vi } from 'vitest';

describe('Setting Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // window.apiのモック
    window.api = {
      project: {
        getPath: vi.fn().mockResolvedValue('/mock/path'),
        getInterval: vi.fn().mockResolvedValue(10),
        savePath: vi.fn().mockResolvedValue(true),
        saveInterval: vi.fn().mockResolvedValue(true),
        saveMaxEditorHeight: vi.fn().mockResolvedValue(8),
        getMaxEditorHeight: vi.fn().mockResolvedValue(90),
      },
      dialog: {
        openFolder: vi.fn().mockResolvedValue({ canceled: false, folderPath: '/new/path' }),
      }
    };
  });

  it('初期値が表示される', async () => {
    render(<Setting onClose={() => {}} />);

    expect(await screen.findByDisplayValue('/mock/path')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('10')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('90')).toBeInTheDocument();
  });

  it('フォルダ選択ボタンでパスが変更される', async () => {
    render(<Setting onClose={() => {}} />);

    const button = await screen.findByText('...');
    fireEvent.click(button);

    expect(await screen.findByDisplayValue('/new/path')).toBeInTheDocument();
  });

  it('適用ボタン押下で設定が保存される', async () => {
    render(<Setting onClose={() => {}} />);

    const button = await screen.findByText('適用');
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.api.project.savePath).toHaveBeenCalled();
      expect(window.api.project.saveInterval).toHaveBeenCalled();
      expect(window.api.project.saveMaxEditorHeight).toHaveBeenCalled();
    });
  });

  it('閉じるボタンでonCloseが呼ばれる', async () => {
    const onCloseMock = vi.fn();
    render(<Setting onClose={onCloseMock} />);
    const closeButton = await screen.findByText('閉じる');
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalled();
  });
});

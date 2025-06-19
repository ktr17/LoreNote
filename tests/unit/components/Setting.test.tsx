import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Setting from '../../../src/renderer/src/components/Setting';
import { vi } from 'vitest';

describe('Setting Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    window.api = {
      project: {
        getPath: vi.fn().mockResolvedValue('/mock/path'),
        getInterval: vi.fn().mockResolvedValue(10),
        savePath: vi.fn().mockResolvedValue(true),
        saveInterval: vi.fn().mockResolvedValue(true),
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
  });

  it('フォルダ選択ボタンでパスが変更される', async () => {
    render(<Setting onClose={() => {}} />);

    const button = await screen.findByText('...');
    fireEvent.click(button);

    expect(await screen.findByDisplayValue('/new/path')).toBeInTheDocument();
  });

  it('適用ボタンで保存成功メッセージが出る', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<Setting onClose={() => {}} />);

    const button = await screen.findByText('適用');
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.api.project.savePath).toHaveBeenCalled();
      expect(window.api.project.saveInterval).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith('保存しました。');
    });
  });

  it('保存失敗時にアラートが表示される', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    window.api.project.savePath = vi.fn().mockResolvedValue(false);
    window.api.project.saveInterval = vi.fn().mockResolvedValue(false);

    render(<Setting onClose={() => {}} />);
    const applyButton = await screen.findByText('適用');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('保存に失敗しました');
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

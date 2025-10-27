import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfirmDialog from '../../../src/renderer/src/components/ConfirmDialog';
import { describe, it, expect, vi } from 'vitest';

describe('ConfirmDialog', () => {
  const defaultProps = {
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    open: true,
    onClose: vi.fn(),
    message: 'この操作を実行してもよろしいですか？',
    buttonText: '削除',
  };

  it('ダイアログが開いているときに表示される', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('確認')).toBeInTheDocument();
    expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
  });

  it('ダイアログが閉じているときに表示されない', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('確認')).not.toBeInTheDocument();
  });

  it('指定されたメッセージが表示される', () => {
    const customMessage = 'カスタムメッセージ';
    render(<ConfirmDialog {...defaultProps} message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('指定されたボタンテキストが表示される', () => {
    const customButtonText = '確定';
    render(<ConfirmDialog {...defaultProps} buttonText={customButtonText} />);

    expect(screen.getByText(customButtonText)).toBeInTheDocument();
  });

  it('キャンセルボタンが表示される', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('確認ボタンをクリックするとonConfirmが呼ばれる', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const confirmButton = screen.getByText(defaultProps.buttonText);
    fireEvent.click(confirmButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('確認ボタンに正しいスタイルが適用されている', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const confirmButton = screen.getByText(defaultProps.buttonText);
    expect(confirmButton).toHaveClass('bg-red-500', 'text-white');
  });

  it('キャンセルボタンに正しいスタイルが適用されている', () => {
    render(<ConfirmDialog {...defaultProps} />);

    const cancelButton = screen.getByText('キャンセル');
    expect(cancelButton).toHaveClass('bg-gray-300');
  });
});

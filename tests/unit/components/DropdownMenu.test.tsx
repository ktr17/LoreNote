import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DropdownMenu from '../../../src/renderer/src/components/DropdownMenu';

describe('DropdownMenu', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    // 各テストの前にモック関数をリセット
    vi.clearAllMocks();
  });

  it('メニューボタンが表示される', () => {
    render(<DropdownMenu onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();
  });
  it('初期状態ではメニューアイテムが表示されない', () => {
    render(<DropdownMenu onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.queryByText('🗑 削除')).not.toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // メニューを開く
    const menuButton = screen.getByRole('button');
    await user.click(menuButton);

    // 削除ボタンをクリック
    const deleteButton = await screen.getByText('🗑 削除');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('削除ボタンに正しいスタイルが適用されている', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const menuButton = screen.getByRole('button');
    await user.click(menuButton);

    await waitFor(() => {
      const deleteButton = screen.getByText('🗑 削除');
      expect(deleteButton).toHaveClass('text-red-500');
    });
  });

  it('メニューボタンにホバースタイルが適用されている', () => {
    render(<DropdownMenu onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const menuButton = screen.getByRole('button');
    expect(menuButton).toHaveClass('hover:bg-gray-100');
  });

  it('SVGアイコンが表示される', () => {
    render(<DropdownMenu onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-5', 'w-5');
  });

  it('メニューが正しい位置に配置される', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    const menuButton = screen.getByRole('button');
    await user.click(menuButton);

    await waitFor(() => {
      const menuItems = screen
        .getByText('🗑 削除')
        .closest('div')?.parentElement;
      expect(menuItems).toHaveClass('absolute', 'right-0');
    });
  });

  it('メニュー外をクリックするとメニューが閉じる', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DropdownMenu onEdit={mockOnEdit} onDelete={mockOnDelete} />
        <div data-testid="outside">外側の要素</div>
      </div>,
    );

    // メニューを開く
    const menuButton = screen.getByRole('button');
    await user.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('🗑 削除')).toBeInTheDocument();
    });

    // 外側をクリック
    const outside = screen.getByTestId('outside');
    await user.click(outside);

    await waitFor(() => {
      expect(screen.queryByText('🗑 削除')).not.toBeInTheDocument();
    });
  });

  it('Escキーを押すとメニューが閉じる', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // メニューを開く
    const menuButton = screen.getByRole('button');
    await user.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('🗑 削除')).toBeInTheDocument();
    });

    // Escキーを押す
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('🗑 削除')).not.toBeInTheDocument();
    });
  });
});

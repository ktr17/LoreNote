import { render, screen, fireEvent } from '@testing-library/react';
import HamburgerMenu from '../../../src/renderer/src/components/HamburgerMenu';
import { describe, it, expect, vi } from 'vitest';

describe('HamburgerMenu', () => {
  const defaultProps = {
    onClick: vi.fn(),
    isOpen: false,
  };

  it('ボタンがレンダリングされる', () => {
    render(<HamburgerMenu {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'メニュー' });
    expect(button).toBeInTheDocument();
  });

  it('クリックするとonClickが呼ばれる', () => {
    render(<HamburgerMenu {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'メニュー' });
    fireEvent.click(button);

    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('isOpen=falseのときは通常の3本線アイコンが表示される', () => {
    const { container } = render(<HamburgerMenu {...defaultProps} isOpen={false} />);

    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(3);

    // 1本目と3本目は回転していない（transform: rotate(0)）
    expect(spans[0]).toHaveStyle({ transform: 'rotate(0)' });
    expect(spans[2]).toHaveStyle({ transform: 'rotate(0)' });

    // 2本目は表示されている（opacity: 1）
    expect(spans[1]).toHaveStyle({ opacity: 1 });
  });

  it('isOpen=trueのときはXアイコンに変化する', () => {
    const { container } = render(<HamburgerMenu {...defaultProps} isOpen={true} />);

    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(3);

    // 1本目は45度回転
    expect(spans[0]).toHaveStyle({ transform: 'rotate(45deg) translateY(10px)' });

    // 2本目は非表示（opacity: 0）
    expect(spans[1]).toHaveStyle({ opacity: 0 });

    // 3本目は-45度回転
    expect(spans[2]).toHaveStyle({ transform: 'rotate(-45deg) translateY(-10px)' });
  });

  it('複数回クリックしても正しく動作する', () => {
    const onClick = vi.fn();
    render(<HamburgerMenu onClick={onClick} isOpen={false} />);

    const button = screen.getByRole('button', { name: 'メニュー' });

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(3);
  });
});

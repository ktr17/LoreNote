import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../../../src/renderer/src/components/Sidebar';
import { describe, it, expect, vi } from 'vitest';
import type { Project } from '../../../src/types/project';

describe('Sidebar', () => {
  const mockProjects: Project[] = [
    { id: '1', name: 'プロジェクト1', path: '/path/to/project1' },
    { id: '2', name: 'プロジェクト2', path: '/path/to/project2' },
    { id: '3', name: 'プロジェクト3', path: '/path/to/project3' },
  ];

  const defaultProps = {
    isOpen: true,
    projects: mockProjects,
    currentProject: mockProjects[0],
    onProjectChange: vi.fn(),
    onClose: vi.fn(),
  };

  it('isOpen=trueのときにサイドバーが表示される', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('プロジェクト')).toBeInTheDocument();
  });

  it('isOpen=falseのときにサイドバーが画面外に移動する', () => {
    const { container } = render(<Sidebar {...defaultProps} isOpen={false} />);

    const sidebar = container.querySelector('div[style*="left"]');
    expect(sidebar).toHaveStyle({ left: '-280px' });
  });

  it('プロジェクトリストが表示される', () => {
    render(<Sidebar {...defaultProps} />);

    mockProjects.forEach((project) => {
      expect(screen.getByText(project.name)).toBeInTheDocument();
      if (project.path) {
        expect(screen.getByText(project.path)).toBeInTheDocument();
      }
    });
  });

  it('現在のプロジェクトがハイライトされる', () => {
    render(<Sidebar {...defaultProps} />);

    const currentProjectButton = screen.getByText('プロジェクト1').closest('button');
    expect(currentProjectButton).toHaveStyle({ backgroundColor: '#eff6ff' });
    expect(currentProjectButton).toHaveStyle({ border: '1px solid #3b82f6' });
  });

  it('プロジェクトをクリックするとonProjectChangeとonCloseが呼ばれる', () => {
    render(<Sidebar {...defaultProps} />);

    const project2Button = screen.getByText('プロジェクト2').closest('button');
    fireEvent.click(project2Button!);

    expect(defaultProps.onProjectChange).toHaveBeenCalledWith('2');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
    const onClose = vi.fn();
    render(<Sidebar {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: '閉じる' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('オーバーレイをクリックするとonCloseが呼ばれる', () => {
    const onClose = vi.fn();
    const { container } = render(<Sidebar {...defaultProps} onClose={onClose} />);

    // オーバーレイはサイドバーの外側の背景
    // isOpenがtrueの時にレンダリングされる最初のdiv要素
    const overlays = container.querySelectorAll('div');
    const overlay = Array.from(overlays).find((div) =>
      div.style.backgroundColor === 'rgba(0, 0, 0, 0.5)'
    );

    expect(overlay).toBeTruthy();
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('プロジェクトが空の場合、メッセージが表示される', () => {
    render(<Sidebar {...defaultProps} projects={[]} />);

    expect(screen.getByText('プロジェクトがありません')).toBeInTheDocument();
  });

  it('currentProjectがnullの場合でも正常に動作する', () => {
    render(<Sidebar {...defaultProps} currentProject={null} />);

    expect(screen.getByText('プロジェクト')).toBeInTheDocument();
    mockProjects.forEach((project) => {
      expect(screen.getByText(project.name)).toBeInTheDocument();
    });
  });

  it('パスがないプロジェクトでも表示される', () => {
    const projectsWithoutPath: Project[] = [
      { id: '1', name: 'プロジェクトA', path: '' },
    ];

    render(
      <Sidebar
        {...defaultProps}
        projects={projectsWithoutPath}
        currentProject={projectsWithoutPath[0]}
      />,
    );

    expect(screen.getByText('プロジェクトA')).toBeInTheDocument();
  });

  it('isOpen=falseのときオーバーレイが表示されない', () => {
    const { container } = render(<Sidebar {...defaultProps} isOpen={false} />);

    const overlays = container.querySelectorAll('div');
    const overlay = Array.from(overlays).find((div) =>
      div.style.backgroundColor === 'rgba(0, 0, 0, 0.5)'
    );

    expect(overlay).toBeUndefined();
  });
});

import React from 'react'

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large' | 'addBtn';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  className = ''
}) => {
  // スタイルの設定
  const baseStyle =
    'rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border-none'

  // バリアントに基づくスタイル(Lookup Table)
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-500 text-white hover:bg-red-700 focus:ring-red-500'
  };

  // サイズに基づくスタイル(Lookup Table)
  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
    addBtn: 'px-4 py-2 w-40'
  }

  // 幅のスタイル
  const widthStyle = fullWidth ? 'w-full' : 'w-24';

  // 無効状態のスタイル
  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

  const buttonStyle = `${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${disabledStyle} ${className}`

  return (
    <button className={buttonStyle} onClick={onClick} type="button">
      {children}
    </button>
  );
};

export default Button;

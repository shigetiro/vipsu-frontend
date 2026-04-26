import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  className = '',
  children,
  ...props
}) => {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  };

  const sizeClasses = {
    small: 'btn-sm',
    medium: '',
    large: 'btn-lg',
  };

  return (
    <button
      className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
      <style>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-primary {
          background: #ff66ab;
          color: #fff;
        }
        .btn-primary:hover:not(:disabled) {
          background: #ff99cc;
        }
        .btn-secondary {
          background: #333;
          color: #fff;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #444;
        }
        .btn-danger {
          background: #ff4757;
          color: #fff;
        }
        .btn-danger:hover:not(:disabled) {
          background: #ff6b7a;
        }
        .btn-ghost {
          background: transparent;
          color: var(--text-primary, #fff);
        }
        .btn-ghost:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }
        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }
        .btn-lg {
          padding: 14px 28px;
          font-size: 16px;
        }
      `}</style>
    </button>
  );
};

export default Button;
export { Button };
import React from 'react';

interface BadgeProps {
  color?: 'red' | 'orange' | 'yellow' | 'blue' | 'gray' | 'green' | 'purple';
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ color = 'gray', children }) => {
  const colorMap: Record<string, string> = {
    red: '#ff4757',
    orange: '#ffa502',
    yellow: '#ffd43b',
    blue: '#3742fa',
    gray: '#747d8c',
    green: '#2ed573',
    purple: '#a55eea',
  };

  const bgColor = colorMap[color] || colorMap.gray;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 500,
        background: `${bgColor}20`,
        color: bgColor,
        border: `1px solid ${bgColor}40`,
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
export { Badge };
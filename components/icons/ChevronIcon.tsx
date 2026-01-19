import React from 'react';

interface ChevronIconProps {
  isExpanded?: boolean;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const ChevronIcon: React.FC<ChevronIconProps> = ({ 
  isExpanded = false, 
  size = 24, 
  color = '#5C6BC0', 
  style 
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      color: color,
      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.3s ease-in-out',
      ...style,
    }}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

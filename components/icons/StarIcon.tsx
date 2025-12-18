import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const StarIcon: React.FC<{ size?: number }> = ({ size = 20 }) => {
  const { theme } = useTheme();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={theme.name === 'dark' ? '#FFD700' : '#FBC02D'}
      stroke={theme.name === 'dark' ? '#FFD700' : '#FBC02D'}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
};
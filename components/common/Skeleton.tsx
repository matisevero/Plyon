
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  width?: string;
  height?: string;
  variant?: 'rect' | 'circle' | 'text';
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = '20px', variant = 'rect', style }) => {
  const { theme } = useTheme();

  const baseStyle: React.CSSProperties = {
    width,
    height,
    backgroundColor: theme.name === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
    borderRadius: variant === 'circle' ? '50%' : variant === 'text' ? '4px' : theme.borderRadius.medium,
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    ...style,
  };

  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      <div style={baseStyle} aria-hidden="true" />
    </>
  );
};

export default Skeleton;

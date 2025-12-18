
import React from 'react';

export const RefreshIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 12c0-3.6 2-6.6 5-8.4l3.5 3.1M22 12c0 3.6-2 6.6-5 8.4l-3.5-3.1" />
  </svg>
);

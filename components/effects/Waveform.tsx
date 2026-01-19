
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const Waveform: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '20px' }}>
      <style>{`
        @keyframes wave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .wave-bar {
          width: 4px;
          border-radius: 2px;
          background-color: ${theme.colors.accent1};
          animation: wave 1s ease-in-out infinite;
        }
      `}</style>
      <div className="wave-bar" style={{ animationDelay: '0s' }}></div>
      <div className="wave-bar" style={{ animationDelay: '0.1s' }}></div>
      <div className="wave-bar" style={{ animationDelay: '0.2s' }}></div>
      <div className="wave-bar" style={{ animationDelay: '0.3s' }}></div>
      <div className="wave-bar" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );
};

export default Waveform;

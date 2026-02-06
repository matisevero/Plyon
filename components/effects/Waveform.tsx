
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const Waveform: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '60px' }}>
      <style>{`
        @keyframes sound-wave {
          0% { height: 10px; opacity: 0.5; }
          50% { height: 100%; opacity: 1; }
          100% { height: 10px; opacity: 0.5; }
        }
        .bar {
          width: 6px;
          border-radius: 99px;
          background: ${theme.colors.accent1};
          animation: sound-wave 1s ease-in-out infinite;
          box-shadow: 0 0 10px ${theme.colors.accent1}80;
        }
      `}</style>
      <div className="bar" style={{ height: '20px', animationDuration: '0.8s', animationDelay: '0s' }}></div>
      <div className="bar" style={{ height: '40px', animationDuration: '1.1s', animationDelay: '0.1s' }}></div>
      <div className="bar" style={{ height: '55px', animationDuration: '1.3s', animationDelay: '0.2s' }}></div>
      <div className="bar" style={{ height: '30px', animationDuration: '0.9s', animationDelay: '0.3s' }}></div>
      <div className="bar" style={{ height: '45px', animationDuration: '1.2s', animationDelay: '0.4s' }}></div>
    </div>
  );
};

export default Waveform;

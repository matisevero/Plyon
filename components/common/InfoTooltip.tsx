
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { InfoIcon } from '../icons/InfoIcon';

interface InfoTooltipProps {
  text: string;
  size?: number;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, size = 18 }) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');

  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(!isVisible);
  };

  // Adjust position if it goes off screen
  useEffect(() => {
    if (isVisible && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.bottom + 100 > window.innerHeight) {
            setPosition('top');
        } else {
            setPosition('bottom');
        }
    }
  }, [isVisible]);

  // Close on click outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
              setIsVisible(false);
          }
      };
      if (isVisible) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      verticalAlign: 'middle',
      marginLeft: '8px',
      zIndex: 10,
    },
    button: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isVisible ? theme.colors.accent2 : theme.colors.secondaryText,
      transition: 'color 0.2s',
      borderRadius: '50%',
    },
    tooltip: {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'max-content',
      maxWidth: '250px',
      padding: '12px',
      backgroundColor: theme.colors.surface,
      color: theme.colors.primaryText,
      fontSize: '0.85rem',
      fontWeight: 400,
      lineHeight: '1.5',
      borderRadius: theme.borderRadius.medium,
      boxShadow: theme.shadows.large,
      border: `1px solid ${theme.colors.border}`,
      zIndex: 1000,
      textAlign: 'left',
      animation: 'fadeIn 0.2s ease-out',
      ...(position === 'bottom' ? { top: '100%', marginTop: '8px' } : { bottom: '100%', marginBottom: '8px' })
    },
    arrow: {
        position: 'absolute',
        left: '50%',
        marginLeft: '-6px',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        ...(position === 'bottom' 
            ? { top: '-6px', borderBottom: `6px solid ${theme.colors.border}` } 
            : { bottom: '-6px', borderTop: `6px solid ${theme.colors.border}` }
        )
    },
    arrowInner: {
        position: 'absolute',
        left: '50%',
        marginLeft: '-5px',
        width: 0,
        height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        ...(position === 'bottom' 
            ? { top: '-4px', borderBottom: `5px solid ${theme.colors.surface}` } 
            : { bottom: '-4px', borderTop: `5px solid ${theme.colors.surface}` }
        )
    }
  };

  return (
    <div style={styles.container} ref={containerRef}>
      <button 
        style={styles.button} 
        onClick={toggleVisibility}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        aria-label="Más información"
        type="button"
      >
        <InfoIcon size={size} />
      </button>
      {isVisible && (
        <div style={styles.tooltip}>
            <div style={styles.arrow}></div>
            <div style={styles.arrowInner}></div>
            {text}
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;

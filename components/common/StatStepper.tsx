import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface StatStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  activeColor: string;
  label?: string;
  icon?: React.ReactNode;
}

const StatStepper: React.FC<StatStepperProps> = ({ value, onChange, activeColor, label, icon }) => {
  const { theme } = useTheme();

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(value + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(Math.max(0, value - 1));
  };

  const isActive = value > 0;

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'relative',
      display: 'inline-block',
    },
    mainButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.1rem',
      backgroundColor: isActive ? activeColor : theme.colors.background,
      color: isActive ? theme.colors.textOnAccent : theme.colors.secondaryText,
      border: `1px solid ${isActive ? activeColor : theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      padding: '0.15rem',
      width: '32px',
      height: '32px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      userSelect: 'none',
      position: 'relative',
    },
    decrementButton: {
      position: 'absolute',
      top: '-4px',
      left: '-4px',
      backgroundColor: theme.colors.surface,
      color: theme.colors.primaryText,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: '50%',
      width: '13px',
      height: '13px',
      cursor: 'pointer',
      transition: 'opacity 0.2s, transform 0.2s',
      fontSize: '0.6rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      userSelect: 'none',
      zIndex: 1,
      boxShadow: theme.shadows.small,
    },
    icon: {
        fontSize: '0.7rem',
        lineHeight: 1,
    },
    valueText: {
        lineHeight: 1,
    }
  };

  return (
    <div style={styles.container} aria-label={label}>
      {isActive && (
        <button type="button" onClick={handleDecrement} style={styles.decrementButton} aria-label={`Reducir ${label}`}>-</button>
      )}
      <button type="button" onClick={handleIncrement} style={styles.mainButton} aria-label={`Aumentar ${label}`}>
        {icon && <span style={styles.icon}>{icon}</span>}
        <span style={styles.valueText}>{value}</span>
      </button>
    </div>
  );
};

export default StatStepper;
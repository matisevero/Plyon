import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SegmentedControlProps {
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, selectedValue, onSelect }) => {
  const { theme } = useTheme();
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const isDark = theme.name === 'dark';

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      borderRadius: theme.borderRadius.medium,
      border: `1px solid ${theme.colors.borderStrong}`,
      overflow: 'hidden',
      width: '100%',
    },
    button: {
      flex: 1,
      padding: `${theme.spacing.small} ${theme.spacing.medium}`,
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.8rem',
      transition: 'background-color 0.2s, color 0.2s',
      border: 'none',
      borderRight: `1px solid ${theme.colors.borderStrong}`,
    },
    lastButton: {
      borderRight: 'none',
    },
  };

  const getButtonStyle = (value: string): React.CSSProperties => {
    const isActive = selectedValue === value;
    const isHovered = hoveredValue === value;
    const style: React.CSSProperties = {};

    if (isDark) {
      if (isActive) {
        style.backgroundColor = '#a1a8d6'; // Active state from header buttons
        style.color = '#1c2237';
      } else if (isHovered) {
        style.backgroundColor = '#414a6b'; // Hover state from header buttons
        style.color = '#a1a8d6';
      } else {
        // Explicitly set inactive state
        style.backgroundColor = 'transparent';
        style.color = theme.colors.secondaryText;
      }
    } else { // Light Theme
      if (isActive) {
        style.backgroundColor = '#c8cdd7'; // Active state from header buttons
        style.color = '#1c2237';
      } else if (isHovered) {
        style.backgroundColor = '#f5f6fa'; // Hover state from header buttons
        style.color = theme.colors.primaryText;
      } else {
        // Explicitly set inactive state
        style.backgroundColor = 'transparent';
        style.color = theme.colors.secondaryText;
      }
    }
    
    return style;
  };

  return (
    <div style={styles.container}>
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          onMouseEnter={() => setHoveredValue(option.value)}
          onMouseLeave={() => setHoveredValue(null)}
          style={{
            ...styles.button,
            ...(index === options.length - 1 ? styles.lastButton : {}),
            ...getButtonStyle(option.value),
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
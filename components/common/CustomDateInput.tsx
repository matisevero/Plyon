import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { parseLocalDate } from '../../utils/analytics';

interface CustomDateInputProps {
  value: string;
  onChange: (value: string) => void;
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({ value, onChange }) => {
  const { theme } = useTheme();

  const formattedDate = React.useMemo(() => {
    if (!value) return 'Seleccionar fecha';
    const dateObj = parseLocalDate(value);
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');
  }, [value]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'relative',
      width: '100%',
      height: '48px', // Match height of other inputs
    },
    display: {
      width: '100%',
      height: '100%',
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      color: theme.colors.primaryText,
      fontSize: theme.typography.fontSize.medium,
      display: 'flex',
      alignItems: 'center',
      boxSizing: 'border-box',
    },
    nativeInput: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: 0,
      cursor: 'pointer',
      border: 'none',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.display}>
        {formattedDate}
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.nativeInput}
        aria-label="Seleccionar fecha"
      />
    </div>
  );
};

export default CustomDateInput;

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  valueStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  count?: number;
  isOngoing?: boolean;
  trend?: 'up' | 'down' | 'neutral'; // New prop for direction
  reverseTrendColor?: boolean; // New prop: true means Up is Bad (Red), Down is Good (Green)
}

const StatCard: React.FC<StatCardProps> = ({ label, value, valueStyle = {}, icon, count, isOngoing, trend, reverseTrendColor = false }) => {
  const { theme } = useTheme();
  const [displayValue, setDisplayValue] = useState<string | number>(typeof value === 'number' ? 0 : value);
  const valueRef = useRef(0);
  const isNumeric = typeof value === 'number';

  useEffect(() => {
    if (!isNumeric) {
      setDisplayValue(value);
      return;
    }

    const targetValue = value;
    const startValue = valueRef.current;
    valueRef.current = targetValue;

    const duration = 1000; // 1 second animation
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      // Ease out quart function for smooth landing
      const easeOut = 1 - Math.pow(1 - percentage, 4);
      
      const animatedValue = Math.floor(startValue + (targetValue - startValue) * easeOut);
      setDisplayValue(animatedValue);

      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

  }, [value, isNumeric]);

  const getTrendIcon = () => {
      if (!trend || trend === 'neutral') return null;
      
      const isUp = trend === 'up';
      // Default: Up = Good (Green), Down = Bad (Loss color/Red)
      // Reverse: Up = Bad (Loss color/Red), Down = Good (Green)
      
      let color;
      if (reverseTrendColor) {
          color = isUp ? theme.colors.loss : theme.colors.win;
      } else {
          color = isUp ? theme.colors.win : theme.colors.loss; // Assuming loss color is reddish/negative indicator
      }

      // We use simple arrows, maybe slightly rotated for style
      return (
          <span style={{ 
              color: color, 
              fontSize: '0.8rem', 
              marginLeft: '6px', 
              verticalAlign: 'middle', 
              display: 'inline-flex',
              alignItems: 'center',
              fontWeight: 800,
              opacity: 0.8
          }}>
              {isUp ? '↑' : '↓'}
          </span>
      );
  };

  const styles: { [key: string]: React.CSSProperties } = {
    card: {
      backgroundColor: theme.colors.background,
      padding: '1rem',
      borderRadius: '12px',
      border: `1px solid ${theme.colors.borderStrong}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: '0.25rem',
      position: 'relative',
      transition: 'transform 0.2s',
    },
    valueContainer: {
      display: 'flex',
      alignItems: 'center', // Center align vertically
      justifyContent: 'center',
      gap: '0.25rem',
      width: '100%',
    },
    value: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: theme.colors.primaryText,
      lineHeight: 1.1,
      fontVariantNumeric: 'tabular-nums', // Keeps numbers from jumping width
    },
    countBadge: {
      backgroundColor: theme.colors.border,
      color: theme.colors.secondaryText,
      padding: '2px 6px',
      borderRadius: theme.borderRadius.small,
      fontSize: '0.75rem',
      fontWeight: 700,
      marginLeft: '0.25rem',
    },
    labelContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: theme.colors.secondaryText
    },
    label: {
      fontSize: '0.8rem',
      fontWeight: 500,
    },
  };

  return (
    <div style={styles.card}>
       <div style={styles.valueContainer}>
        {isOngoing && <span style={{ fontSize: '1.25rem' }}>🏅</span>}
        <span style={{...styles.value, ...valueStyle}}>
            {isNumeric ? displayValue : value}
        </span>
        {getTrendIcon()}
        {/* Only show if count is defined AND strictly greater than 1 */}
        {(count || 0) > 1 && <span style={styles.countBadge}>x{count}</span>}
      </div>
      <div style={styles.labelContainer}>
        {icon}
        <span style={styles.label}>{label}</span>
      </div>
    </div>
  );
};

export default StatCard;

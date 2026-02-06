import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  valueStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  count?: number;
  isOngoing?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  reverseTrendColor?: boolean;
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

    const duration = 1000;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
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
      let color;
      if (reverseTrendColor) {
          color = isUp ? theme.colors.loss : theme.colors.win;
      } else {
          color = isUp ? theme.colors.win : theme.colors.loss;
      }

      return (
          <span className={styles.trendIcon} style={{ color }}>
              {isUp ? '\u2191' : '\u2193'}
          </span>
      );
  };

  return (
    <div className={styles.card}>
       <div className={styles.valueContainer}>
        {isOngoing && <span style={{ fontSize: '1.25rem' }}>{'🏅'}</span>}
        <span className={styles.value} style={valueStyle}>
            {isNumeric ? displayValue : value}
        </span>
        {getTrendIcon()}
        {(count || 0) > 1 && <span className={styles.countBadge}>{'x'}{count}</span>}
      </div>
      <div className={styles.labelContainer}>
        {icon}
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
};

export default StatCard;

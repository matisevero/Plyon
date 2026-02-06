
import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface YearFilterProps {
  years: (string | number)[];
  selectedYear: string | 'all';
  onSelectYear: (year: string | 'all') => void;
  showAllTime?: boolean;
  size?: 'small' | 'medium';
  allTimeLabel?: string;
}

const YearFilter: React.FC<YearFilterProps> = ({ years, selectedYear, onSelectYear, showAllTime = true, size = 'medium', allTimeLabel = 'HISTÓRICO' }) => {
  const { theme } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  
  // Track scroll possibilities for masking
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sortedYears = [...years].sort((a, b) => Number(b) - Number(a));
  const allOptions = showAllTime ? ['all', ...sortedYears] : sortedYears;

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      // 1px buffer to handle sub-pixel rendering differences
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      // Initial check
      checkScroll();
      
      const timer = setTimeout(checkScroll, 100);
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      return () => {
        clearTimeout(timer);
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [allOptions]);

  // If there's only one or zero options, there's nothing to filter.
  if (allOptions.length <= 1) {
    return null;
  }

  const getTabStyle = (option: string | number) => {
    const isActive = selectedYear.toString() === option.toString();
    const isHovered = hoveredTab === option.toString();
    const style: React.CSSProperties = { ...styles.tabButton };
    
    if (theme.name === 'dark') {
      if (isActive) {
        style.backgroundColor = '#a1a8d6';
        style.color = '#1c2237';
        style.borderColor = '#a1a8d6';
      } else if (isHovered) {
        style.backgroundColor = '#414a6b';
        style.color = '#a1a8d6';
        style.borderColor = '#414a6b';
      } else {
        style.backgroundColor = 'transparent';
        style.color = theme.colors.secondaryText;
        style.borderColor = theme.colors.borderStrong;
      }
    } else { // Light theme
      if (isActive) {
        style.backgroundColor = '#c8cdd7';
        style.color = '#1c2237';
        style.borderColor = '#c8cdd7';
      } else if (isHovered) {
        style.backgroundColor = '#f5f6fa';
        style.color = theme.colors.primaryText;
        style.borderColor = '#f5f6fa';
      } else {
        style.backgroundColor = 'transparent';
        style.color = theme.colors.secondaryText;
        style.borderColor = theme.colors.borderStrong;
      }
    }
    return style;
  };

  // Dynamic mask image logic
  const maskImage = `linear-gradient(to right, ${canScrollLeft ? 'transparent, black 20px' : 'black 0%'}, black 90%, ${canScrollRight ? 'transparent' : 'black'})`;

  const styles: { [key: string]: React.CSSProperties } = {
    container: { 
      width: '100%',
      minWidth: 0,
      position: 'relative',
      overflow: 'hidden',
    },
    scrollContainer: {
      display: 'flex', 
      gap: '0.5rem', 
      overflowX: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      paddingBottom: '0.25rem', // Space for focus ring
      width: '100%', 
      boxSizing: 'border-box',
      // Dynamic Masking
      maskImage: maskImage,
      WebkitMaskImage: maskImage,
    },
    tabButton: {
      padding: size === 'small' ? `0.3rem 0.8rem` : `${theme.spacing.small} ${theme.spacing.medium}`,
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: size === 'small' ? theme.typography.fontSize.extraSmall : theme.typography.fontSize.small,
      background: 'transparent',
      border: `1px solid ${theme.colors.borderStrong}`,
      color: theme.colors.secondaryText,
      borderRadius: theme.borderRadius.medium,
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      flexShrink: 0, 
    },
  };

  return (
    <>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div style={styles.container}>
        <div style={styles.scrollContainer} className="no-scrollbar" ref={scrollContainerRef}>
          {/* Padding for mask space */}
          {canScrollLeft && <div style={{width: '1px', flexShrink: 0}} />}
          
          {allOptions.map(year => (
            <button
              key={year}
              style={getTabStyle(year)}
              onClick={() => onSelectYear(year.toString())}
              onMouseEnter={() => setHoveredTab(year.toString())}
              onMouseLeave={() => setHoveredTab(null)}
            >
              {year === 'all' ? allTimeLabel : year}
            </button>
          ))}
          
          {canScrollRight && <div style={{width: '1px', flexShrink: 0}} />}
        </div>
      </div>
    </>
  );
};

export default YearFilter;

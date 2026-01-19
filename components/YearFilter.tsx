
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
  const [isScrollable, setIsScrollable] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const sortedYears = [...years].sort((a, b) => Number(b) - Number(a));
  const allOptions = showAllTime ? ['all', ...sortedYears] : sortedYears;

  useEffect(() => {
    const checkScrollable = () => {
      const el = scrollContainerRef.current;
      if (el) {
        setIsScrollable(el.scrollWidth > el.clientWidth + 1);
      }
    };

    const timeoutId = setTimeout(checkScrollable, 100);
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkScrollable);
    };
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

  const styles: { [key: string]: React.CSSProperties } = {
    container: { 
      width: '100%',
      // minWidth: 0 is important for flex/grid children to shrink properly
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
      width: '100%', // Force full width usage
      boxSizing: 'border-box',
      // Masking for smooth edges
      maskImage: isScrollable ? 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' : 'none',
      WebkitMaskImage: isScrollable ? 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' : 'none',
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
      flexShrink: 0, // Prevent buttons from shrinking
    },
    // Fallback fade overlay if mask-image isn't desired or for older browsers (optional, masking is cleaner)
    fadeOverlayRight: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: '30px',
      height: '100%',
      background: `linear-gradient(to left, ${theme.colors.surface}, transparent)`,
      pointerEvents: 'none',
      display: isScrollable ? 'block' : 'none'
    },
    fadeOverlayLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '30px',
        height: '100%',
        background: `linear-gradient(to right, ${theme.colors.surface}, transparent)`,
        pointerEvents: 'none',
        display: isScrollable ? 'block' : 'none'
      }
  };

  return (
    <>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div style={styles.container}>
        <div style={styles.scrollContainer} className="no-scrollbar" ref={scrollContainerRef}>
          {/* Add padding spacers for mask/fade effect */}
          {isScrollable && <div style={{width: '1px', flexShrink: 0}} />}
          
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
          
          {isScrollable && <div style={{width: '1px', flexShrink: 0}} />}
        </div>
        {/* If masks fail or aren't supported, we could use these overlays, but masking is cleaner. 
            For now, relying on maskImage as modern solution. 
        */}
      </div>
    </>
  );
};

export default YearFilter;

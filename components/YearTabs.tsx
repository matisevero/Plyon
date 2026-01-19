import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface YearTabsProps {
  years: (string | number)[];
  selectedYear: string | 'all';
  onSelectYear: (year: string | 'all') => void;
  allTimeLabel?: string;
}

const YearTabs: React.FC<YearTabsProps> = ({ years, selectedYear, onSelectYear, allTimeLabel = 'Historial' }) => {
  const { theme } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showFades, setShowFades] = useState({ left: false, right: false });
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const allOptions = ['all', ...years];

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const isScrollable = el.scrollWidth > el.clientWidth;
      setShowFades({
        left: isScrollable && el.scrollLeft > 5,
        right: isScrollable && el.scrollLeft < el.scrollWidth - el.clientWidth - 5,
      });
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const timer = setTimeout(checkScroll, 100);
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        clearTimeout(timer);
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [years]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const activeButton = el.querySelector(`[data-year="${selectedYear}"]`) as HTMLElement;
      if (activeButton) {
        const containerRect = el.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        const desiredScrollLeft = activeButton.offsetLeft - (containerRect.width / 2) + (buttonRect.width / 2);
        el.scrollTo({ left: desiredScrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedYear]);
  
  const getTabStyle = (option: string | number) => {
    const isActive = selectedYear.toString() === option.toString();
    const isHovered = hoveredTab === option.toString();
    const style: React.CSSProperties = { border: `1px solid ${theme.colors.borderStrong}` };

    if (isActive) {
        style.backgroundColor = theme.colors.accent2;
        style.color = theme.colors.textOnAccent;
        style.borderColor = theme.colors.accent2;
    } else if (isHovered) {
        style.backgroundColor = theme.colors.border;
        style.color = theme.colors.primaryText;
    } else { // Inactive
        style.backgroundColor = 'transparent';
        style.color = theme.colors.secondaryText;
    }
    return style;
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'relative',
      width: '100%',
      maxWidth: '100%', // Enforce width constraint
      overflow: 'hidden', // Contain scrolling area
    },
    scrollContainer: {
      display: 'flex',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      padding: `${theme.spacing.medium} 0`,
      justifyContent: 'center', // Center if not overflowing
      width: '100%',
      boxSizing: 'border-box',
    },
    buttonGroup: {
        display: 'inline-flex', // Use inline-flex to allow centering
        flexShrink: 0,
        gap: '0.5rem', // Add consistent gap inside group
    },
    tabButton: {
      flexShrink: 0,
      padding: `${theme.spacing.small} ${theme.spacing.medium}`,
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: theme.typography.fontSize.small,
      background: 'transparent',
      transition: 'all 0.2s ease',
    },
    fade: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '40px',
        pointerEvents: 'none',
        transition: 'opacity 0.2s',
    },
    leftFade: {
        left: 0,
        background: `linear-gradient(to right, ${theme.colors.background}, transparent)`,
    },
    rightFade: {
        right: 0,
        background: `linear-gradient(to left, ${theme.colors.background}, transparent)`,
    },
  };

  return (
    <>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div style={styles.container}>
        <div ref={scrollContainerRef} style={styles.scrollContainer} className="no-scrollbar" onScroll={checkScroll}>
          <div style={styles.buttonGroup}>
            {allOptions.map((year, index) => {
                const buttonStateStyle = getTabStyle(year);
                const buttonPositionStyle: React.CSSProperties = {};
                
                if (index > 0) {
                    buttonPositionStyle.borderLeft = 'none';
                }
                if (index === 0) {
                    buttonPositionStyle.borderRadius = `${theme.borderRadius.medium} 0 0 ${theme.borderRadius.medium}`;
                } else if (index === allOptions.length - 1) {
                    buttonPositionStyle.borderRadius = `0 ${theme.borderRadius.medium} ${theme.borderRadius.medium} 0`;
                } else {
                    buttonPositionStyle.borderRadius = 0;
                }

                return (
                    <button
                        key={year}
                        data-year={year}
                        style={{ ...styles.tabButton, ...buttonStateStyle, ...buttonPositionStyle }}
                        onClick={() => onSelectYear(year.toString())}
                        onMouseEnter={() => setHoveredTab(year.toString())}
                        onMouseLeave={() => setHoveredTab(null)}
                    >
                        {year === 'all' ? allTimeLabel : year}
                    </button>
                )
            })}
          </div>
        </div>
        <div style={{...styles.fade, ...styles.leftFade, opacity: showFades.left ? 1 : 0}}></div>
        <div style={{...styles.fade, ...styles.rightFade, opacity: showFades.right ? 1 : 0}}></div>
      </div>
    </>
  );
};

export default YearTabs;

import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { TableIcon } from './icons/TableIcon';
import { UsersIcon } from './icons/UsersIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import type { Page } from '../types';

const BottomTabBar: React.FC = () => {
  const { theme } = useTheme();
  const { currentPage, setCurrentPage } = useData();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Don't show on desktop, landing page, or admin page
  if (isDesktop || currentPage === 'landing' || currentPage === 'admin') return null;

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '65px',
      backgroundColor: theme.colors.surface,
      borderTop: `1px solid ${theme.colors.border}`,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: theme.shadows.large,
    },
    tab: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      background: 'none',
      border: 'none',
      color: theme.colors.secondaryText,
      fontSize: '0.65rem',
      fontWeight: 600,
      padding: '8px 0',
      cursor: 'pointer',
      flex: 1,
      height: '100%',
      transition: 'color 0.2s',
    },
    activeTab: {
      color: theme.colors.accent1,
    }
  };

  return (
    <div style={styles.container}>
       <button style={{ ...styles.tab, ...(currentPage === 'recorder' ? styles.activeTab : {}) }} onClick={() => setCurrentPage('recorder')}>
         <ClipboardIcon size={22} />
         <span>Registro</span>
       </button>
       <button style={{ ...styles.tab, ...(currentPage === 'stats' ? styles.activeTab : {}) }} onClick={() => setCurrentPage('stats')}>
         <BarChartIcon size={22} />
         <span>Stats</span>
       </button>
       <button style={{ ...styles.tab, ...(currentPage === 'worldcup' ? styles.activeTab : {}) }} onClick={() => setCurrentPage('worldcup')}>
         <TrophyIcon size={22} />
         <span>Carrera</span>
       </button>
       <button style={{ ...styles.tab, ...(currentPage === 'social' ? styles.activeTab : {}) }} onClick={() => setCurrentPage('social')}>
         <UsersIcon size={22} />
         <span>Social</span>
       </button>
       <button style={{ ...styles.tab, ...(currentPage === 'settings' ? styles.activeTab : {}) }} onClick={() => setCurrentPage('settings')}>
         <SettingsIcon size={22} />
         <span>Ajustes</span>
       </button>
    </div>
  );
};

export default BottomTabBar;

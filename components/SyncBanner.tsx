
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { Loader } from './Loader';
import { CheckIcon } from './icons/CheckIcon';
import { CloudOffIcon } from './icons/CloudOffIcon';
import { EyeIcon } from './icons/EyeIcon';

const SyncBanner: React.FC = () => {
  const { theme } = useTheme();
  const { syncState, forceSync, isReadOnly } = useData();
  
  if (!syncState || syncState.status === 'LOCAL' || syncState.status === 'LOADING') {
    return null;
  }

  // Auto-hide synced message handled by context or just show nothing for clean UI
  if (syncState.status === 'SYNCED') {
      return null; 
  }

  const getBannerContent = () => {
    switch (syncState.status) {
      case 'SYNCED':
        return { text: 'Sincronizado', icon: <CheckIcon size={16} />, color: theme.colors.win, showButton: false };
      case 'SYNCING_UP':
      case 'SYNCING_DOWN':
        return { text: `Sincronizando datos...`, icon: <Loader />, color: theme.colors.accent2, showButton: false };
      case 'ERROR':
        return { text: syncState.error || 'Error de conexión', icon: <CloudOffIcon size={16} />, color: theme.colors.loss, showButton: true };
      case 'READ_ONLY':
        return { text: 'Vista de Solo Lectura', icon: <EyeIcon size={16} />, color: theme.colors.accent3, showButton: false };
      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;

  const styles: { [key: string]: React.CSSProperties } = {
    banner: {
      position: 'fixed',
      top: '65px', // Below header
      left: 0,
      width: '100%',
      backgroundColor: theme.colors.surface,
      color: theme.colors.primaryText,
      zIndex: 1500,
      boxShadow: theme.shadows.medium,
      fontSize: '0.8rem',
      fontWeight: 500,
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      padding: '0.5rem'
    },
    contentWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.large,
    },
    status: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.small,
      color: content.color,
    },
    button: {
      padding: '0.25rem 0.75rem',
      borderRadius: theme.borderRadius.small,
      fontSize: '0.75rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      backgroundColor: theme.colors.accent1,
      color: theme.colors.textOnAccent,
      border: 'none',
    },
  };

  return (
    <div style={styles.banner}>
        <div style={styles.contentWrapper}>
          <div style={styles.status}>
            {content.icon}
            <span>{content.text}</span>
          </div>
          {content.showButton && (
            <button onClick={forceSync} style={styles.button}>
              Reintentar
            </button>
          )}
        </div>
    </div>
  );
};

export default SyncBanner;

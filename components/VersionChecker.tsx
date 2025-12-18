
import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { RefreshIcon } from './icons/RefreshIcon';
import { APP_VERSION } from '../version';

const VersionChecker: React.FC = () => {
  const { theme } = useTheme();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Add timestamp to bypass browser cache
        const response = await fetch(`/metadata.json?t=${new Date().getTime()}`);
        if (!response.ok) return;
        
        const remoteMetadata = await response.json();
        
        if (remoteMetadata.version !== APP_VERSION) {
          console.log(`Update available: ${APP_VERSION} -> ${remoteMetadata.version}`);
          setServerVersion(remoteMetadata.version);
          setUpdateAvailable(true);
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
      }
    };

    // Check on mount
    checkVersion();

    // Check when window regains focus (user comes back to tab)
    window.addEventListener('focus', checkVersion);
    
    // Check every 60 minutes
    const interval = setInterval(checkVersion, 60 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', checkVersion);
      clearInterval(interval);
    };
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!updateAvailable) return null;

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: theme.colors.surface,
      color: theme.colors.primaryText,
      padding: '12px 20px',
      borderRadius: '50px',
      boxShadow: theme.shadows.large,
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      border: `1px solid ${theme.colors.accent1}`,
      animation: 'slideUp 0.3s ease-out',
      maxWidth: '90%',
      width: 'max-content',
    },
    text: {
      fontSize: '0.9rem',
      fontWeight: 500,
    },
    versionBadge: {
      backgroundColor: theme.colors.accent1,
      color: theme.colors.textOnAccent,
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 700,
      marginLeft: '5px',
    },
    button: {
      backgroundColor: theme.colors.accent1,
      color: theme.colors.textOnAccent,
      border: 'none',
      borderRadius: '20px',
      padding: '6px 12px',
      fontSize: '0.8rem',
      fontWeight: 700,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      whiteSpace: 'nowrap',
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
      <div style={styles.container}>
        <div style={styles.text}>
          Nueva versión disponible 
          {serverVersion && <span style={styles.versionBadge}>v{serverVersion}</span>}
        </div>
        <button onClick={handleUpdate} style={styles.button}>
          <RefreshIcon size={16} /> Actualizar
        </button>
      </div>
    </>
  );
};

export default VersionChecker;


import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { FootballIcon } from '../icons/FootballIcon';
import { CloseIcon } from '../icons/CloseIcon';

interface IncomingMatchesNotifierProps {
  onOpen: () => void;
}

const IncomingMatchesNotifier: React.FC<IncomingMatchesNotifierProps> = ({ onOpen }) => {
  const { theme } = useTheme();
  const { pendingMatches } = useData();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show notification if there are NEW pending matches compared to last seen
    const checkNotification = () => {
        const currentCount = pendingMatches.length;
        if (currentCount === 0) {
            setIsVisible(false);
            return;
        }

        // Get the last known count from persistent storage
        const lastSeenCount = parseInt(localStorage.getItem('plyon_last_pending_count') || '0', 10);

        // Only show if we have NEW items (current > last seen)
        if (currentCount > lastSeenCount) {
            setIsVisible(true);
        } else {
            // Even if we have matches, if count is <= lastSeen, assume user saw them
            setIsVisible(false);
        }
    };

    checkNotification();
  }, [pendingMatches.length]);

  const handleOpen = () => {
      // Update count when user actually opens/checks them
      localStorage.setItem('plyon_last_pending_count', pendingMatches.length.toString());
      setIsVisible(false);
      onOpen();
  };

  const handleDismiss = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Even on dismiss, we can count them as 'seen' so it doesn't pop up again immediately
      localStorage.setItem('plyon_last_pending_count', pendingMatches.length.toString());
      setIsVisible(false);
  };

  if (!isVisible || pendingMatches.length === 0) return null;

  const uniqueSenders = Array.from(new Set(pendingMatches.map(m => m.fromUserName)));
  const senderText = uniqueSenders.length === 1 
    ? uniqueSenders[0] 
    : uniqueSenders.length === 2 
        ? `${uniqueSenders[0]} y ${uniqueSenders[1]}` 
        : `${uniqueSenders[0]} y otros`;

  const isHistorySync = pendingMatches.length > 5;

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'fixed',
      bottom: '80px', // Above navigation bar on mobile if present, or just nicely spaced
      right: '20px',
      left: '20px', // Constrained on mobile
      maxWidth: '400px',
      marginLeft: 'auto', // Push to right on desktop via max-width
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      border: `1px solid ${theme.colors.accent2}`,
      padding: theme.spacing.medium,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.medium,
      zIndex: 2000,
      animation: 'slideUpBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      cursor: 'pointer',
    },
    iconContainer: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        backgroundColor: `${theme.colors.accent2}20`,
        borderRadius: '50%',
        color: theme.colors.accent2,
        flexShrink: 0,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: theme.colors.loss,
        color: 'white',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        padding: '2px 6px',
        borderRadius: '10px',
        border: `2px solid ${theme.colors.surface}`
    },
    textContainer: {
        flex: 1,
    },
    title: {
        margin: 0,
        fontSize: '0.95rem',
        fontWeight: 700,
        color: theme.colors.primaryText,
    },
    subtitle: {
        margin: '2px 0 0 0',
        fontSize: '0.8rem',
        color: theme.colors.secondaryText,
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: theme.colors.secondaryText,
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
    },
    actionButton: {
        marginTop: '8px',
        backgroundColor: theme.colors.accent2,
        color: theme.colors.textOnAccent,
        border: 'none',
        padding: '6px 12px',
        borderRadius: theme.borderRadius.medium,
        fontSize: '0.8rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        width: '100%'
    }
  };

  return (
    <>
        <style>{`
            @keyframes slideUpBounce {
                0% { transform: translateY(100px); opacity: 0; }
                60% { transform: translateY(-10px); opacity: 1; }
                100% { transform: translateY(0); }
            }
        `}</style>
        <div style={styles.container} onClick={handleOpen}>
            <div style={styles.iconContainer}>
                <FootballIcon size={24} />
                <div style={styles.badge}>{pendingMatches.length}</div>
            </div>
            <div style={styles.textContainer}>
                <h4 style={styles.title}>
                    {isHistorySync ? '¡Historial Recibido!' : 'Nuevos Partidos'}
                </h4>
                <p style={styles.subtitle}>
                    {senderText} te envió {pendingMatches.length} {pendingMatches.length === 1 ? 'partido' : 'partidos'}.
                </p>
                <button style={styles.actionButton}>
                    Revisar ahora
                </button>
            </div>
            <button 
                style={styles.closeButton} 
                onClick={handleDismiss}
            >
                <CloseIcon size={16} />
            </button>
        </div>
    </>
  );
};

export default IncomingMatchesNotifier;


import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { CloseIcon } from '../icons/CloseIcon';
import type { Notification, Match } from '../../types';
import { parseLocalDate } from '../../utils/analytics';

const NotificationCenter: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { notifications, matches } = useData();

  const lastMatchWithin48h = useMemo(() => {
    if (matches.length === 0) {
      return null;
    }
    const sortedMatches = [...matches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
    const lastMatch = sortedMatches[0];
    const matchDate = parseLocalDate(lastMatch.date);
    const now = new Date();
    const hoursDiff = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff <= 48) {
      return lastMatch;
    }

    return null;
  }, [matches]);

  const groupedNotifications = useMemo(() => {
      const groups = {
          today: [] as Notification[],
          week: [] as Notification[],
          month: [] as Notification[],
          older: [] as Notification[]
      };

      const now = new Date();
      // Reset time to midnight for comparison
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Sort by date descending first
      const sortedNotifs = [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      sortedNotifs.forEach(n => {
          const date = new Date(n.date);
          if (date >= startOfToday) {
              groups.today.push(n);
          } else if (date >= startOfWeek) {
              groups.week.push(n);
          } else if (date >= startOfMonth) {
              groups.month.push(n);
          } else {
              groups.older.push(n);
          }
      });

      return groups;
  }, [notifications]);
  
  const resultColors = {
      VICTORIA: { border: theme.colors.win, text: theme.colors.win },
      DERROTA: { border: theme.colors.loss, text: theme.colors.loss },
      EMPATE: { border: theme.colors.draw, text: theme.colors.draw }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1998,
      animation: 'fadeIn 0.3s ease-out forwards',
    },
    panel: {
      position: 'fixed', top: 0, right: 0, width: 'clamp(280px, 85vw, 360px)', height: '100%',
      background: theme.colors.surface,
      zIndex: 1999,
      display: 'flex', flexDirection: 'column',
      boxShadow: theme.shadows.large,
      animation: 'slideIn 0.3s ease-out forwards',
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.5rem 1rem', borderBottom: `1px solid ${theme.colors.border}`,
      height: '65px', flexShrink: 0,
    },
    title: {
      fontSize: theme.typography.fontSize.large, fontWeight: 700,
      color: theme.colors.primaryText, margin: 0,
    },
    iconButton: {
        background: 'none', border: 'none', color: theme.colors.secondaryText,
        cursor: 'pointer', padding: theme.spacing.small,
    },
    content: {
      flex: 1, overflowY: 'auto', padding: theme.spacing.medium,
    },
    emptyState: {
        textAlign: 'center', color: theme.colors.secondaryText,
        padding: theme.spacing.extraLarge,
    },
    groupTitle: {
        fontSize: '0.75rem',
        fontWeight: 700,
        color: theme.colors.secondaryText,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        margin: `${theme.spacing.medium} 0 ${theme.spacing.small} 0`,
    },
    notificationList: {
        listStyle: 'none', padding: 0, margin: 0,
        display: 'flex', flexDirection: 'column', gap: theme.spacing.small,
    },
    notificationItem: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.medium,
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: theme.spacing.medium,
    },
    notificationMessage: {
        margin: 0, color: theme.colors.primaryText,
        fontSize: theme.typography.fontSize.small,
        lineHeight: 1.4,
        flex: 1,
    },
    notificationDate: {
        margin: 0,
        fontSize: '0.7rem',
        color: theme.colors.secondaryText,
        whiteSpace: 'nowrap',
        fontWeight: 600,
        flexShrink: 0,
    },
    lastMatchCard: {
        marginBottom: theme.spacing.medium,
        padding: theme.spacing.medium,
        borderRadius: theme.borderRadius.medium,
        border: `2px solid`,
        backgroundColor: theme.colors.background,
    },
    lastMatchHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.medium,
    },
    lastMatchTitle: {
        margin: 0,
        fontWeight: 'bold',
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.primaryText,
    },
    lastMatchDate: {
        fontSize: theme.typography.fontSize.extraSmall,
        color: theme.colors.secondaryText,
    },
    lastMatchStats: {
        display: 'flex',
        justifyContent: 'space-around',
        textAlign: 'center',
    },
    statItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
    },
    statValue: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: theme.colors.primaryText,
    },
    statLabel: {
        fontSize: '0.7rem',
        color: theme.colors.secondaryText,
        textTransform: 'uppercase',
    }
  };

  const renderNotificationGroup = (title: string, items: Notification[], dateFormat: 'time' | 'day' | 'full') => {
      if (items.length === 0) return null;
      return (
          <>
            <h5 style={styles.groupTitle}>{title}</h5>
            <ul style={styles.notificationList}>
                {items.map(notification => {
                    const dateObj = new Date(notification.date);
                    let dateString = '';
                    if (dateFormat === 'time') {
                        dateString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } else if (dateFormat === 'day') {
                        dateString = dateObj.toLocaleDateString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
                    } else {
                        dateString = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                    }

                    return (
                        <li key={notification.id} style={styles.notificationItem}>
                            <p style={styles.notificationMessage}>{notification.message}</p>
                            <span style={styles.notificationDate}>{dateString}</span>
                        </li>
                    );
                })}
            </ul>
          </>
      );
  };
  
  const modalJSX = (
      <>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>
        <div style={styles.backdrop} onClick={onClose}></div>
        <div style={styles.panel}>
            <header style={styles.header}>
                <h3 style={styles.title}>Notificaciones</h3>
                <button style={styles.iconButton} onClick={onClose} aria-label="Cerrar notificaciones">
                    <CloseIcon color={theme.colors.primaryText} size={28} />
                </button>
            </header>
            <main style={styles.content}>
                {!lastMatchWithin48h && notifications.length === 0 ? (
                    <div style={styles.emptyState}>No tienes notificaciones nuevas.</div>
                ) : (
                    <>
                        {lastMatchWithin48h && (
                           <div style={{...styles.lastMatchCard, borderColor: resultColors[lastMatchWithin48h.result].border}}>
                               <div style={styles.lastMatchHeader}>
                                   <h4 style={styles.lastMatchTitle}>Resumen de tu último partido</h4>
                                   <span style={styles.lastMatchDate}>
                                       {parseLocalDate(lastMatchWithin48h.date).toLocaleDateString('es-ES', { weekday: 'long' })}
                                   </span>
                               </div>
                               <div style={styles.lastMatchStats}>
                                   <div style={styles.statItem}>
                                       <span style={{...styles.statValue, color: resultColors[lastMatchWithin48h.result].text}}>
                                           {lastMatchWithin48h.result}
                                       </span>
                                       <span style={styles.statLabel}>Resultado</span>
                                   </div>
                                   <div style={styles.statItem}>
                                       <span style={styles.statValue}>⚽️ {lastMatchWithin48h.myGoals}</span>
                                       <span style={styles.statLabel}>Goles</span>
                                   </div>
                                   <div style={styles.statItem}>
                                       <span style={styles.statValue}>👟 {lastMatchWithin48h.myAssists}</span>
                                       <span style={styles.statLabel}>Asistencias</span>
                                   </div>
                               </div>
                           </div>
                        )}
                        
                        {renderNotificationGroup('Hoy', groupedNotifications.today, 'time')}
                        {renderNotificationGroup('Esta Semana', groupedNotifications.week, 'day')}
                        {renderNotificationGroup('Este Mes', groupedNotifications.month, 'full')}
                        {renderNotificationGroup('Anteriores', groupedNotifications.older, 'full')}
                    </>
                )}
            </main>
        </div>
      </>
  );

  if (!isOpen) return null;
  return createPortal(modalJSX, document.body);
};

export default NotificationCenter;

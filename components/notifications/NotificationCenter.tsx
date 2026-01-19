
import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { CloseIcon } from '../icons/CloseIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { UserIcon } from '../icons/UserIcon';
import { StarIcon } from '../icons/StarIcon';
import { BellIcon } from '../icons/BellIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { ChevronIcon } from '../icons/ChevronIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { LockerRoomIcon } from '../icons/LockerRoomIcon';
import type { Notification, FriendRequest, PendingMatch } from '../../types';
import { parseLocalDate } from '../../utils/analytics';
import SegmentedControl from '../common/SegmentedControl';

// --- Utility: Time Grouping ---
type TimeGroup = 'today' | 'week' | 'month' | 'year' | 'older';

const getTimeGroup = (dateStr: string): TimeGroup => {
    const date = new Date(dateStr);
    const now = new Date();
    
    // Reset hours to compare dates purely
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = n.getTime() - d.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (diffDays < 1) return 'today';
    if (diffDays < 7) return 'week';
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) return 'month';
    if (date.getFullYear() === now.getFullYear()) return 'year';
    return 'older';
};

const getGroupLabel = (group: TimeGroup): string => {
    switch (group) {
        case 'today': return 'Hoy';
        case 'week': return 'Esta Semana';
        case 'month': return 'Este Mes';
        case 'year': return 'Este Año';
        case 'older': return 'Antiguos';
    }
};

// --- Components ---

const NotificationGroup: React.FC<{ 
    groupKey: TimeGroup;
    items: any[]; 
    renderItem: (item: any) => React.ReactNode;
    theme: any;
}> = ({ groupKey, items, renderItem, theme }) => {
    // Default open only for Today and This Week
    const [isOpen, setIsOpen] = useState(groupKey === 'today' || groupKey === 'week');

    if (items.length === 0) return null;

    const styles: { [key: string]: React.CSSProperties } = {
        groupContainer: {
            marginBottom: theme.spacing.medium,
        },
        groupHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${theme.spacing.small} 0`,
            cursor: 'pointer',
            userSelect: 'none',
            borderBottom: isOpen ? 'none' : `1px solid ${theme.colors.border}`,
            marginBottom: isOpen ? theme.spacing.small : 0,
        },
        groupTitle: {
            fontSize: '0.8rem',
            fontWeight: 800,
            color: theme.colors.secondaryText,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        countBadge: {
            backgroundColor: theme.colors.border,
            color: theme.colors.primaryText,
            borderRadius: '10px',
            padding: '2px 6px',
            fontSize: '0.7rem',
            fontWeight: 600
        },
        chevron: {
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: theme.colors.secondaryText,
        },
        listContainer: {
            display: isOpen ? 'flex' : 'none',
            flexDirection: 'column',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-out',
        },
    };

    return (
        <div style={styles.groupContainer}>
            <div style={styles.groupHeader} onClick={() => setIsOpen(!isOpen)}>
                <h5 style={styles.groupTitle}>
                    {getGroupLabel(groupKey)}
                    <span style={styles.countBadge}>{items.length}</span>
                </h5>
                <div style={styles.chevron}>
                    <ChevronIcon size={16} color="currentColor" />
                </div>
            </div>
            <div style={styles.listContainer}>
                {items.map(renderItem)}
            </div>
        </div>
    );
};

const NotificationCenter: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { 
    notifications, 
    pendingMatches, 
    friendRequests, 
    confirmPendingMatch, 
    respondToFriendRequest, 
    markNotificationsAsRead,
    deleteNotification
  } = useData();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // Lock body and html scroll when open to prevent background scrolling
  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }
    return () => { 
        document.body.style.overflow = ''; 
        document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  // Unified sorting function
  const sortByDateDesc = (a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();

  // Combine Pending Items
  const pendingItems = useMemo(() => {
      const requests = friendRequests.map(r => ({ ...r, type: 'friend_request', date: r.createdAt }));
      const matches = pendingMatches.map(m => ({ ...m, type: 'pending_match', date: m.createdAt }));
      return [...requests, ...matches].sort(sortByDateDesc);
  }, [friendRequests, pendingMatches]);

  const sortedHistory = useMemo(() => {
      return [...notifications].sort(sortByDateDesc);
  }, [notifications]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Grouping Logic Generic
  const groupItems = (items: any[]) => {
      const groups: Record<TimeGroup, any[]> = { today: [], week: [], month: [], year: [], older: [] };
      items.forEach(item => {
          const group = getTimeGroup(item.date || item.createdAt);
          groups[group].push(item);
      });
      return groups;
  };

  const groupedPending = useMemo(() => groupItems(pendingItems), [pendingItems]);
  const groupedHistory = useMemo(() => groupItems(sortedHistory), [sortedHistory]);

  const pendingCount = pendingItems.length;

  // Auto-switch tab logic only on first open
  useEffect(() => {
      if (isOpen) {
          if (pendingCount > 0) setActiveTab('pending');
          else setActiveTab('history');
      }
  }, [isOpen]); 

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1998,
      animation: 'fadeIn 0.3s ease-out forwards',
      backdropFilter: 'blur(3px)',
    },
    panel: {
      position: 'fixed', top: 0, right: 0, width: 'clamp(300px, 90vw, 420px)', height: '100%',
      background: theme.colors.surface, zIndex: 1999,
      display: 'flex', flexDirection: 'column',
      boxShadow: theme.shadows.large,
      animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    },
    header: {
      display: 'flex', flexDirection: 'column', gap: '16px',
      padding: '1.5rem', borderBottom: `1px solid ${theme.colors.border}`,
      flexShrink: 0,
      backgroundColor: theme.colors.surface,
    },
    topRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'
    },
    titleContainer: {
        display: 'flex', alignItems: 'center', gap: '10px'
    },
    title: { 
        fontSize: '1.25rem', // Consistent with app header
        fontWeight: 700, 
        color: theme.colors.primaryText, 
        margin: 0, 
        fontFamily: theme.typography.fontFamily,
        lineHeight: 1.2
    },
    lockerRoomText: {
        background: `linear-gradient(90deg, ${theme.colors.primaryText}, ${theme.colors.secondaryText})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    content: { flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: theme.colors.background },
    
    // Actions Bar in History
    actionBar: {
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        marginBottom: theme.spacing.medium,
        paddingBottom: theme.spacing.small,
        borderBottom: `1px solid ${theme.colors.border}`,
        minHeight: '24px' // Consistent height
    },
    markReadBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '0.75rem', fontWeight: 800, color: theme.colors.accent2,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '4px 8px', borderRadius: '4px',
        transition: 'background-color 0.2s',
    },
    allReadText: {
        fontSize: '0.75rem', fontWeight: 800, color: theme.colors.win,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '4px 8px',
        opacity: 0.8,
        cursor: 'default'
    },

    // Card Styles
    card: {
        backgroundColor: theme.colors.surface, padding: '1.25rem',
        borderRadius: '16px', border: `1px solid ${theme.colors.border}`,
        position: 'relative', boxShadow: theme.shadows.small,
        display: 'flex', flexDirection: 'column', gap: '10px'
    },
    compactCard: {
        backgroundColor: theme.colors.surface,
        padding: '12px 14px',
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.border}`,
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        transition: 'background-color 0.2s, opacity 0.2s, border-color 0.2s'
    },
    unreadIndicator: {
        width: '6px', height: '6px', borderRadius: '50%',
        backgroundColor: theme.colors.accent2,
        marginTop: '4px'
    },
    messageTitle: { fontSize: '0.9rem', fontWeight: 700, color: theme.colors.primaryText, margin: 0 },
    messageBody: { fontSize: '0.85rem', color: theme.colors.secondaryText, margin: 0, lineHeight: 1.4 },
    actionRow: { display: 'flex', gap: '8px', marginTop: '4px' },
    actionBtn: {
        flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
        fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    acceptBtn: { backgroundColor: theme.colors.win, color: theme.colors.textOnAccent },
    rejectBtn: { backgroundColor: 'transparent', color: theme.colors.loss, border: `1px solid ${theme.colors.loss}40` },
    timeText: { fontSize: '0.65rem', color: theme.colors.secondaryText, whiteSpace: 'nowrap', marginTop: '2px' },
    emptyState: {
        textAlign: 'center', padding: '4rem 1rem', color: theme.colors.secondaryText,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'
    },
    statusCard: {
        backgroundColor: `${theme.colors.accent2}10`,
        border: `1px solid ${theme.colors.accent2}30`,
        borderRadius: theme.borderRadius.large,
        padding: '2rem',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box'
    },
    deleteBtnSmall: {
        background: 'none', border: 'none', color: theme.colors.secondaryText,
        cursor: 'pointer', padding: '4px', opacity: 0.5,
        display: 'flex', alignItems: 'center'
    },
  };

  const renderPendingItem = (item: any) => {
      const isRequest = item.type === 'friend_request';
      return (
          <div key={item.id} style={{...styles.card, borderColor: isRequest ? theme.colors.accent1 : theme.colors.accent2}}>
              <div>
                  <h4 style={styles.messageTitle}>
                      {isRequest ? <><UserIcon size={14} /> Solicitud de Amistad</> : <><StarIcon size={14} /> Etiqueta en Partido</>}
                  </h4>
                  <p style={{...styles.messageBody, color: theme.colors.primaryText, marginTop: '4px'}}>
                      {isRequest 
                          ? <span><strong>{item.fromName}</strong> quiere conectar contigo.</span> 
                          : <span><strong>{item.fromUserName}</strong> te etiquetó como {item.role === 'teammate' ? 'Compañero' : 'Rival'}.</span>
                      }
                  </p>
                  {!isRequest && <span style={styles.timeText}>Partido del {parseLocalDate(item.matchData.date).toLocaleDateString()}</span>}
              </div>
              <div style={styles.actionRow}>
                  <button style={{...styles.actionBtn, ...styles.acceptBtn}} onClick={() => isRequest ? respondToFriendRequest(item.id, 'accept') : confirmPendingMatch(item, 'accept')}>Confirmar</button>
                  <button style={{...styles.actionBtn, ...styles.rejectBtn}} onClick={() => isRequest ? respondToFriendRequest(item.id, 'reject') : confirmPendingMatch(item, 'reject')}>Rechazar</button>
              </div>
          </div>
      );
  };

  const renderHistoryItem = (item: Notification) => {
      const isFriendAccepted = item.type === 'friend_accepted';
      const timeStr = new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
      
      // Icon mapping: Default to '📲' as requested for system/general notifications.
      const icon = isFriendAccepted ? '🤝' : '📲';
      
      return (
          <div key={item.id} style={{
              ...styles.compactCard, 
              borderLeft: isFriendAccepted ? `4px solid ${theme.colors.win}` : `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              // Reduced opacity for read items to ~30% visibility as requested ("un 10%" is usually interpreted as 90% transparent or 10% opacity, but 0.1 is too faint, 0.3 is legible but clearly disabled)
              opacity: item.read ? 0.3 : 1, 
          }}>
              <div style={{
                   display: 'flex', 
                   flexDirection: 'column', 
                   alignItems: 'center', 
                   gap: '0px',
                   minWidth: '24px',
                   marginRight: '4px'
               }}>
                   <div style={{fontSize: '1.2rem', lineHeight: 1}}>
                       {icon}
                   </div>
                   {/* Unread indicator below icon */}
                   {!item.read && <div style={styles.unreadIndicator} />} 
               </div>

              <div style={{flex: 1}}>
                  <p style={{...styles.messageBody, color: theme.colors.primaryText, fontWeight: item.read ? 400 : 600}}>{item.message}</p>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px'}}>
                  <span style={styles.timeText}>{timeStr}</span>
                  <button 
                    style={styles.deleteBtnSmall} 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(item.id); }} 
                    title="Eliminar del historial"
                  >
                      <TrashIcon size={12}/>
                  </button>
              </div>
          </div>
      );
  };

  const tabOptions = [
      { label: `Pendientes${pendingCount > 0 ? ` (${pendingCount})` : ''}`, value: 'pending' },
      { label: 'Notas', value: 'history' }
  ];

  const groupOrder: TimeGroup[] = ['today', 'week', 'month', 'year', 'older'];

  const modalJSX = (
      <>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            .notif-scroll::-webkit-scrollbar { width: 6px; }
            .notif-scroll::-webkit-scrollbar-thumb { background: ${theme.colors.borderStrong}; border-radius: 10px; }
        `}</style>
        <div style={styles.backdrop} onClick={onClose}></div>
        <div style={styles.panel}>
            <header style={styles.header}>
                <div style={styles.topRow}>
                    <div style={styles.titleContainer}>
                        <LockerRoomIcon size={24} color={theme.colors.primaryText} />
                        <h3 style={styles.title}>
                            <span style={styles.lockerRoomText}>Plyr</span> Locker Room
                        </h3>
                    </div>
                    <button style={{background:'none', border:'none', cursor:'pointer', padding: '4px'}} onClick={onClose}>
                        <CloseIcon color={theme.colors.primaryText} size={24} />
                    </button>
                </div>
                <SegmentedControl 
                    options={tabOptions}
                    selectedValue={activeTab}
                    onSelect={(val) => setActiveTab(val as any)}
                />
            </header>

            <main style={styles.content} className="notif-scroll">
                
                {activeTab === 'pending' && (
                    <>
                        {pendingItems.length === 0 ? (
                            <div style={styles.emptyState}>
                                <div style={styles.statusCard}>
                                    <div style={{color: theme.colors.accent2, marginBottom: '8px'}}><SparklesIcon size={24} /></div>
                                    <h4 style={{margin: '0 0 8px 0', color: theme.colors.accent2}}>Todo al día</h4>
                                    <p style={{margin: 0, fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.5}}>
                                        No tienes solicitudes ni validaciones pendientes. ¡Estás listo para jugar!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            groupOrder.map(group => (
                                <NotificationGroup
                                    key={group}
                                    groupKey={group}
                                    items={groupedPending[group]}
                                    renderItem={renderPendingItem}
                                    theme={theme}
                                />
                            ))
                        )}
                    </>
                )}

                {activeTab === 'history' && (
                    <section>
                        {sortedHistory.length > 0 && (
                            <div style={styles.actionBar}>
                                {unreadCount > 0 ? (
                                    <button 
                                        style={styles.markReadBtn} 
                                        onClick={markNotificationsAsRead}
                                    >
                                        <CheckIcon size={14} /> Marcar como visto
                                    </button>
                                ) : (
                                    <div style={styles.allReadText}>
                                        <CheckIcon size={14} /> Todo visto
                                    </div>
                                )}
                            </div>
                        )}

                        {sortedHistory.length === 0 ? (
                            <div style={styles.emptyState}>
                                <p style={{fontStyle: 'italic'}}>No tienes notas en el historial.</p>
                            </div>
                        ) : (
                            groupOrder.map(group => (
                                <NotificationGroup
                                    key={group}
                                    groupKey={group}
                                    items={groupedHistory[group]}
                                    renderItem={renderHistoryItem}
                                    theme={theme}
                                />
                            ))
                        )}
                    </section>
                )}
            </main>
        </div>
      </>
  );

  if (!isOpen) return null;
  return createPortal(modalJSX, document.body);
};

export default NotificationCenter;

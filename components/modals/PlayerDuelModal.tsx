
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { savePlayerMapping, searchUsers, getFriendsList, removePlayerMapping, sendRetroactivePendingMatches } from '../../services/firebaseService';
import type { Match, PublicProfile } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import { Loader } from '../Loader';
import StatCard from '../StatCard';
import DonutChart from '../DonutChart';
import { ChevronIcon } from '../icons/ChevronIcon';
import { parseLocalDate } from '../../utils/analytics';
import { LinkIcon } from '../icons/LinkIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { ShareIcon } from '../icons/ShareIcon';

interface PlayerDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string | null;
  allMatches: Match[];
}

const PlayerDuelModal: React.FC<PlayerDuelModalProps> = ({ isOpen, onClose, playerName, allMatches }) => {
  const { theme } = useTheme();
  const { playerProfile, updatePlayerProfile } = useData();
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');
  const profile = usePlayerProfile(playerName, allMatches, selectedYear);
  const isDark = theme.name === 'dark';
  
  const [activeView, setActiveView] = useState<'teammate' | 'opponent' | null>(null);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [isHistoryExpanded, setHistoryExpanded] = useState(false);

  // Linking State
  const [isConnectionMenuOpen, setIsConnectionMenuOpen] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const [linkResults, setLinkResults] = useState<PublicProfile[]>([]);
  const [isSearchingLink, setIsSearchingLink] = useState(false);
  const [linkedProfile, setLinkedProfile] = useState<PublicProfile | null>(null);
  
  // Sync Status: 'idle' | 'loading' | 'success'
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Check if mapped
  const mappedId = playerName ? playerProfile.playerMappings?.[playerName] : undefined;

  useEffect(() => {
      if (mappedId && isOpen) {
          getFriendsList([mappedId]).then(profiles => {
              if (profiles.length > 0) setLinkedProfile(profiles[0]);
          });
      } else {
          setLinkedProfile(null);
      }
      // Reset menu state on open
      if (isOpen) {
          setIsConnectionMenuOpen(false);
          setSyncStatus('idle');
      }
  }, [mappedId, isOpen, playerName]);

  // Search Effect for Linking
  useEffect(() => {
      if (isConnectionMenuOpen && !linkedProfile && linkQuery.length > 2 && user) {
          setIsSearchingLink(true);
          const timer = setTimeout(async () => {
              try {
                // Search for friends to link
                const results = await searchUsers(linkQuery, user.uid);
                // Filter to show mainly friends or global users
                setLinkResults(results.filter(r => r.uid !== user.uid));
              } catch (e) {
                  console.error(e);
              } finally {
                  setIsSearchingLink(false);
              }
          }, 300);
          return () => clearTimeout(timer);
      } else {
          setLinkResults([]);
          setIsSearchingLink(false);
      }
  }, [isConnectionMenuOpen, linkedProfile, linkQuery, user]);

  const handleLinkUser = async (targetUser: PublicProfile) => {
      if (!user || !playerName) return;
      try {
          await savePlayerMapping(user.uid, playerName, targetUser.uid);
          // Optimistic update
          const newMappings = { ...(playerProfile.playerMappings || {}), [playerName]: targetUser.uid };
          updatePlayerProfile({ playerMappings: newMappings });
          
          setLinkedProfile(targetUser);
          setLinkQuery('');
          // Keep menu open to show sync option immediately
          setIsConnectionMenuOpen(true); 

      } catch (e) {
          console.error("Error linking user", e);
          alert("Error al vincular usuario");
      }
  };

  const handleUnlinkUser = async () => {
      if (!user || !playerName) return;
      if (!confirm(`¿Desvincular a ${playerName} de ${linkedProfile?.name}?`)) return;
      
      try {
          await removePlayerMapping(user.uid, playerName);
          // Optimistic update
          const newMappings = { ...(playerProfile.playerMappings || {}) };
          delete newMappings[playerName];
          updatePlayerProfile({ playerMappings: newMappings });
          
          setLinkedProfile(null);
          setIsConnectionMenuOpen(false);
      } catch (e) {
          console.error("Error unlinking user", e);
          alert("Error al desvincular usuario");
      }
  };

  const handleSyncHistory = async () => {
      const target = linkedProfile;
      if (!user || !playerName || !target) return;

      const lowerName = playerName.toLowerCase().trim();
      const count = allMatches.filter(m => 
          m.myTeamPlayers?.some(p => p.name.toLowerCase().trim() === lowerName) || 
          m.opponentPlayers?.some(p => p.name.toLowerCase().trim() === lowerName)
      ).length;

      if (count === 0) {
          alert("No hay partidos históricos con este nombre para enviar.");
          return;
      }

      // Start Loading State immediately
      setSyncStatus('loading');

      try {
          // Add a small artificial delay so the user sees the "Sending" state
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const sentCount = await sendRetroactivePendingMatches(user.uid, target.uid, playerName, allMatches, playerProfile.name);
          
          setSyncStatus('success');
          
          // Auto reset after 3 seconds
          setTimeout(() => setSyncStatus('idle'), 3000);
      } catch(e: any) {
          console.error("Error sending retroactive matches:", e);
          alert(`Error enviando partidos: ${e.message}`);
          setSyncStatus('idle');
      }
  };

  const availableYears = useMemo(() => {
    if (!playerName) return [];
    const playerMatches = allMatches.filter(m =>
      m.myTeamPlayers?.some(p => p.name === playerName) || m.opponentPlayers?.some(p => p.name === playerName)
    );
    const yearSet = new Set(playerMatches.map(m => parseLocalDate(m.date).getFullYear()));
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [playerName, allMatches]);

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        setSelectedYear('all');
        setHistoryExpanded(false);
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => {
        document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (profile) {
      const isTeammateInvalid = activeView === 'teammate' && !profile.teammateStats;
      const isOpponentInvalid = activeView === 'opponent' && !profile.opponentStats;

      if (isTeammateInvalid && profile.opponentStats) {
        setActiveView('opponent');
      } else if (isOpponentInvalid && profile.teammateStats) {
        setActiveView('teammate');
      } else if (!activeView || (isTeammateInvalid && isOpponentInvalid)) {
        if (profile.teammateStats) {
          setActiveView('teammate');
        } else if (profile.opponentStats) {
          setActiveView('opponent');
        } else {
          setActiveView(null);
        }
      }
    }
  }, [profile, activeView]);

  if (!isOpen || !playerName || !profile) {
    return null;
  }
  
  const stats = activeView === 'teammate' ? profile.teammateStats : profile.opponentStats;

  const getResultStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    const base = {
        width: '24px', height: '24px', borderRadius: '6px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
        fontWeight: 'bold', flexShrink: 0, color: theme.colors.textOnAccent
    };
    switch (result) {
      case 'VICTORIA': return { ...base, backgroundColor: theme.colors.win };
      case 'DERROTA': return { ...base, backgroundColor: theme.colors.loss };
      case 'EMPATE': return { ...base, backgroundColor: theme.colors.draw };
    }
  };
  
  const getFilterButtonStyle = (filter: string) => {
    const isActive = activeView === filter;
    const isHovered = hoveredFilter === filter;
    const style: React.CSSProperties = { border: `1px solid ${theme.colors.borderStrong}` };

    if (isDark) {
        if (isActive) {
            style.backgroundColor = '#a1a8d6';
            style.color = '#1c2237';
            style.borderColor = '#a1a8d6';
        } else if (isHovered) {
            style.backgroundColor = theme.colors.border;
            style.color = theme.colors.primaryText;
        } else {
            style.backgroundColor = 'transparent';
            style.color = theme.colors.secondaryText;
        }
    } else { // Light theme
        if (isActive) {
            style.backgroundColor = '#c8cdd7';
            style.color = '#1c2237';
            style.borderColor = '#c8cdd7';
        } else if (isHovered) {
            style.backgroundColor = theme.colors.border;
            style.color = theme.colors.primaryText;
        } else {
            style.backgroundColor = 'transparent';
            style.color = theme.colors.secondaryText;
        }
    }
    return style;
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.medium,
      animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large,
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      animation: 'scaleUp 0.3s ease',
      border: `1px solid ${theme.colors.border}`,
    },
    header: {
      display: 'flex', 
      flexDirection: 'column',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderBottom: `1px solid ${theme.colors.border}`,
      flexShrink: 0,
      gap: theme.spacing.medium,
    },
    topRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
    },
    title: { 
        margin: 0, 
        fontSize: theme.typography.fontSize.large, 
        fontWeight: 700, 
        color: theme.colors.primaryText,
    },
    closeButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
    content: {
      overflowY: 'auto',
      padding: theme.spacing.large,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.large,
    },
    chartContainer: { display: 'flex', justifyContent: 'center' },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: theme.spacing.medium,
    },
    historySection: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.border}`
    },
    historyHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
        background: 'none', border: 'none', padding: theme.spacing.medium, cursor: 'pointer',
        textAlign: 'left', color: theme.colors.primaryText
    },
    historyTitle: { margin: 0, fontSize: theme.typography.fontSize.medium, fontWeight: 600 },
    historyContent: { padding: `0 ${theme.spacing.medium} ${theme.spacing.medium}`, animation: 'fadeInDown 0.3s ease' },
    matchRow: {
        display: 'flex', alignItems: 'center', gap: theme.spacing.medium,
        padding: `${theme.spacing.small} 0`, borderBottom: `1px solid ${theme.colors.border}`,
    },
    lastMatchRow: { borderBottom: 'none' },
    matchDate: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, flexBasis: '80px' },
    matchStats: { display: 'flex', gap: theme.spacing.medium, color: theme.colors.primaryText },
    matchStatItem: { display: 'flex', alignItems: 'center', gap: '0.35rem' },
    
    // Updated Filter Container layout - FORCED ONE ROW
    filterContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '8px',
        gap: '10px',
        flexWrap: 'nowrap' // Crucial: Prevent wrapping
    },
    buttonGroup: {
        display: 'flex',
        gap: '-1px', // Collapse borders
        flex: '0 1 auto', // Allow shrinking if needed, but grow
    },
    filterButton: {
        padding: `0.4rem 0.8rem`,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'center',
        whiteSpace: 'nowrap' // Prevent text wrap
    },
    yearSelect: {
        padding: '0.4rem 1.2rem 0.4rem 0.6rem',
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.borderStrong}`,
        backgroundColor: theme.colors.background,
        color: theme.colors.primaryText,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 600,
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none', // Remove native arrow
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22${encodeURIComponent(theme.colors.secondaryText)}%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 6px center',
        minWidth: '90px', // Just enough for 'Histórico'
        flexShrink: 0
    },
    // Updated Connection Styles
    connectionToggle: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderRadius: theme.borderRadius.medium,
        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
        border: `1px solid ${linkedProfile ? theme.colors.accent2 : theme.colors.borderStrong}`,
        backgroundColor: linkedProfile ? `${theme.colors.accent2}10` : theme.colors.background, 
        color: linkedProfile ? theme.colors.accent2 : theme.colors.secondaryText,
        transition: 'all 0.2s',
        width: '100%',
    },
    dropdownContent: {
        marginTop: '4px',
        padding: theme.spacing.medium,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.borderStrong}`,
        animation: 'fadeInDown 0.2s ease',
        display: 'flex', flexDirection: 'column', gap: theme.spacing.medium
    },
    linkInput: {
        width: '100%', padding: '8px', borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.accent2}`,
        backgroundColor: theme.colors.surface, color: theme.colors.primaryText,
        outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box'
    },
    resultsList: {
        maxHeight: '150px', overflowY: 'auto',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.medium,
        backgroundColor: theme.colors.surface
    },
    resultItem: {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px', cursor: 'pointer',
        borderBottom: `1px solid ${theme.colors.border}`,
        color: theme.colors.primaryText
    },
    avatarSmall: { width: '20px', height: '20px', borderRadius: '50%' },
    // Compact Sync Button Style
    syncButton: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        padding: '6px 10px', borderRadius: theme.borderRadius.medium,
        border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem',
        transition: 'all 0.2s',
        minWidth: '110px'
    }
  };

  const chartData = stats ? [
    { label: 'Victorias', value: stats.record.wins, color: theme.colors.win },
    { label: 'Empates', value: stats.record.draws, color: theme.colors.draw },
    { label: 'Derrotas', value: stats.record.losses, color: theme.colors.loss },
  ] : [];

  // Define Sync Button Appearance based on Status
  let syncButtonStyle = { ...styles.syncButton, backgroundColor: theme.colors.accent2, color: theme.colors.textOnAccent };
  let syncButtonText: React.ReactNode = <><ShareIcon size={14} /> Enviar historial</>;
  let isSyncDisabled = false;

  if (syncStatus === 'loading') {
      syncButtonStyle = { ...styles.syncButton, backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText, cursor: 'wait' };
      syncButtonText = <><Loader /> Enviando...</>;
      isSyncDisabled = true;
  } else if (syncStatus === 'success') {
      syncButtonStyle = { ...styles.syncButton, backgroundColor: theme.colors.win, color: theme.colors.textOnAccent };
      syncButtonText = <><CheckIcon size={14} /> Enviado</>;
      isSyncDisabled = true;
  }

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        .subtle-scrollbar::-webkit-scrollbar { display: none; }
        .subtle-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div style={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="player-profile-title">
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <header style={styles.header}>
            {/* Top Row: Title + Close */}
            <div style={styles.topRow}>
                <h2 id="player-profile-title" style={styles.title}>{playerName}</h2>
                <button style={styles.closeButton} onClick={onClose} aria-label="Cerrar modal"><CloseIcon color={theme.colors.primaryText} /></button>
            </div>

            {/* Collapsible Connection Menu */}
            {user && (
                <div style={{width: '100%', position: 'relative'}}>
                    {/* Toggle Bar */}
                    <button 
                        style={styles.connectionToggle}
                        onClick={() => setIsConnectionMenuOpen(!isConnectionMenuOpen)}
                    >
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            {linkedProfile ? <CheckIcon size={16} /> : <LinkIcon size={16} />}
                            {linkedProfile ? `Conectado con: ${linkedProfile.name}` : 'Conectar con usuario real'}
                        </div>
                        <div style={{ transform: isConnectionMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'flex' }}>
                            <ChevronIcon isExpanded={isConnectionMenuOpen} />
                        </div>
                    </button>

                    {/* Dropdown Content */}
                    {isConnectionMenuOpen && (
                        <div style={styles.dropdownContent}>
                            {linkedProfile ? (
                                <>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '4px'}}>
                                        <img src={linkedProfile.photo || `https://ui-avatars.com/api/?name=${linkedProfile.name}&background=random`} style={{width: '32px', height: '32px', borderRadius: '50%'}} alt="" />
                                        <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                                            <div style={{fontWeight: 'bold', fontSize: '0.9rem', color: theme.colors.primaryText}}>{linkedProfile.name}</div>
                                            {linkedProfile.username && <div style={{fontSize: '0.75rem', color: theme.colors.secondaryText}}>@{linkedProfile.username}</div>}
                                        </div>
                                        <button 
                                            onClick={handleSyncHistory} 
                                            disabled={isSyncDisabled}
                                            style={syncButtonStyle}
                                            title="Enviar historial de partidos"
                                        >
                                            {syncButtonText}
                                        </button>
                                    </div>

                                    <button 
                                        onClick={handleUnlinkUser} 
                                        style={{
                                            background: 'transparent', border: 'none', color: theme.colors.loss, 
                                            cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline',
                                            alignSelf: 'center', marginTop: '-4px'
                                        }}
                                    >
                                        Desvincular usuario
                                    </button>
                                </>
                            ) : (
                                <>
                                    <input 
                                        autoFocus
                                        placeholder="Buscar amigo (nombre o @usuario)..." 
                                        value={linkQuery}
                                        onChange={e => setLinkQuery(e.target.value)}
                                        style={styles.linkInput}
                                    />
                                    {isSearchingLink && <div style={{textAlign: 'center', padding: '4px'}}><Loader /></div>}
                                    {linkResults.length > 0 && (
                                        <div style={styles.resultsList}>
                                            {linkResults.map(res => (
                                                <div key={res.uid} style={styles.resultItem} onClick={() => handleLinkUser(res)}>
                                                    <img src={res.photo || `https://ui-avatars.com/api/?name=${res.name}&background=random`} style={styles.avatarSmall} alt="" />
                                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                                        <span style={{fontSize: '0.85rem', fontWeight: 'bold'}}>{res.name}</span>
                                                        {res.username && <span style={{fontSize: '0.7rem', color: theme.colors.secondaryText}}>@{res.username}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div style={styles.filterContainer}>
                  <div style={styles.buttonGroup}>
                      {profile.teammateStats && (
                          <button 
                              style={{
                                  ...styles.filterButton, 
                                  ...getFilterButtonStyle('teammate'),
                                  borderRadius: profile.opponentStats ? `${theme.borderRadius.medium} 0 0 ${theme.borderRadius.medium}` : theme.borderRadius.medium
                              }}
                              onClick={() => setActiveView('teammate')}
                              onMouseEnter={() => setHoveredFilter('teammate')}
                              onMouseLeave={() => setHoveredFilter(null)}
                          >
                              Compañero
                          </button>
                      )}
                      {profile.opponentStats && (
                          <button 
                              style={{
                                  ...styles.filterButton, 
                                  ...getFilterButtonStyle('opponent'),
                                  borderLeft: profile.teammateStats ? 'none' : `1px solid ${theme.colors.borderStrong}`,
                                  borderRadius: profile.teammateStats ? `0 ${theme.borderRadius.medium} ${theme.borderRadius.medium} 0` : theme.borderRadius.medium
                              }}
                              onClick={() => setActiveView('opponent')}
                              onMouseEnter={() => setHoveredFilter('opponent')}
                              onMouseLeave={() => setHoveredFilter(null)}
                          >
                              Rival
                          </button>
                      )}
                  </div>
                  
                  {/* Year Dropdown in Header */}
                  <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(e.target.value)} 
                      style={styles.yearSelect}
                  >
                      <option value="all">Histórico</option>
                      {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                      ))}
                  </select>
              </div>
          </header>
          
          <div style={styles.content} className="subtle-scrollbar">
            {stats ? (
              <>
                <div style={styles.chartContainer}>
                  <DonutChart data={chartData} />
                </div>
                
                <div style={styles.statsGrid}>
                  <StatCard label="% Victorias" value={`${stats.winRate.toFixed(1)}%`} />
                  <StatCard label="Puntos cosechados" value={stats.points} />
                  <StatCard label="Goles / Partido" value={stats.gpm.toFixed(2)} />
                  <StatCard label="Asist. / Partido" value={stats.apm.toFixed(2)} />
                </div>
                
                {stats.matches.length > 0 && (
                  <div style={styles.historySection}>
                    <button style={styles.historyHeader} onClick={() => setHistoryExpanded(!isHistoryExpanded)}>
                        <h4 style={styles.historyTitle}>Historial de partidos</h4>
                        <ChevronIcon isExpanded={isHistoryExpanded} />
                    </button>
                    {isHistoryExpanded && (
                        <div style={styles.historyContent}>
                            <div>
                                {stats.matches.map((match, index) => (
                                    <div key={match.id} style={ index === stats.matches.length - 1 ? {...styles.matchRow, ...styles.lastMatchRow} : styles.matchRow}>
                                        <span style={styles.matchDate}>{parseLocalDate(match.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                                        <div style={getResultStyle(match.result)}>{match.result.charAt(0)}</div>
                                        <div style={styles.matchStats}>
                                            <span style={styles.matchStatItem}>⚽️ {match.myGoals}</span>
                                            <span style={styles.matchStatItem}>👟 {match.myAssists}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                  </div>
                )}
              </>
            ) : (
                <div style={{ textAlign: 'center', padding: theme.spacing.extraLarge, color: theme.colors.secondaryText }}>
                    No hay datos para {activeView === 'teammate' ? 'este jugador como compañero' : 'este jugador como rival'} en {selectedYear === 'all' ? 'el historial completo' : `la temporada ${selectedYear}`}.
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};

export default PlayerDuelModal;

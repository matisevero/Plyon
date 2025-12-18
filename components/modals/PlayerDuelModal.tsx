import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import type { Match } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import StatCard from '../StatCard';
import DonutChart from '../DonutChart';
import { ChevronIcon } from '../icons/ChevronIcon';
import YearFilter from '../YearFilter';
import { parseLocalDate } from '../../utils/analytics';

interface PlayerDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string | null;
  allMatches: Match[];
}

const PlayerDuelModal: React.FC<PlayerDuelModalProps> = ({ isOpen, onClose, playerName, allMatches }) => {
  const { theme } = useTheme();
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');
  const profile = usePlayerProfile(playerName, allMatches, selectedYear);
  const isDark = theme.name === 'dark';
  
  const [activeView, setActiveView] = useState<'teammate' | 'opponent' | null>(null);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [isHistoryExpanded, setHistoryExpanded] = useState(false);

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
    const style: React.CSSProperties = { border: '1px solid' };

    if (isDark) {
        if (isHovered) {
            style.backgroundColor = '#414a6b';
            style.color = '#a1a8d6';
            style.borderColor = '#414a6b';
        } else if (isActive) {
            style.backgroundColor = '#a1a8d6';
            style.color = '#1c2237';
            style.borderColor = '#414a6b';
        } else { // Inactive
            style.backgroundColor = '#1c2237';
            style.color = '#a1a8d6';
            style.borderColor = '#414a6b';
        }
    } else { // Light theme
        if (isHovered) {
            style.backgroundColor = '#f5f6fa';
            style.color = '#1c2237';
            style.borderColor = '#f5f6fa';
        } else if (isActive) {
            style.backgroundColor = '#c8cdd7';
            style.color = '#1c2237';
            style.borderColor = '#c7ced8';
        } else { // Inactive
            style.backgroundColor = '#ffffff';
            style.color = '#1c2237';
            style.borderColor = '#c7ced8';
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
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderBottom: `1px solid ${theme.colors.border}`,
      flexShrink: 0,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    closeButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
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
    filterContainer: {
        display: 'flex',
    },
    filterButton: {
        padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`,
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
        flex: 1,
    },
  };

  const chartData = stats ? [
    { label: 'Victorias', value: stats.record.wins, color: theme.colors.win },
    { label: 'Empates', value: stats.record.draws, color: theme.colors.draw },
    { label: 'Derrotas', value: stats.record.losses, color: theme.colors.loss },
  ] : [];

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        .subtle-scrollbar::-webkit-scrollbar { width: 6px; }
        .subtle-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .subtle-scrollbar::-webkit-scrollbar-thumb { background-color: ${theme.colors.border}; border-radius: 10px; }
        .subtle-scrollbar { scrollbar-width: thin; scrollbar-color: ${theme.colors.border} transparent; }
      `}</style>
      <div style={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="player-profile-title">
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <header style={styles.header}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <h2 id="player-profile-title" style={styles.title}>{playerName}</h2>
              <div style={styles.filterContainer}>
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
                              borderLeft: profile.teammateStats ? 'none' : '1px solid',
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
            </div>
            <button style={styles.closeButton} onClick={onClose} aria-label="Cerrar modal"><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          
          <div style={styles.content} className="subtle-scrollbar">
            <YearFilter
                years={availableYears}
                selectedYear={selectedYear}
                onSelectYear={setSelectedYear}
            />
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

import React, { useState, useMemo } from 'react';
import type { Match, MatchSortByType, PlayerPerformance } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { ChevronIcon } from './icons/ChevronIcon';
import { TrashIcon } from './icons/TrashIcon';
import { TeamIcon } from './icons/TeamIcon';
import { PlayerIcon } from './icons/PlayerIcon';
import MatchFormIndicator from './MatchFormIndicator';
import { ShareIcon } from './icons/ShareIcon';
import { parseLocalDate, getColorForString } from '../utils/analytics';

interface MatchCardProps {
  match: Match;
  allMatches: Match[];
  allPlayers: string[];
  onDelete?: () => void;
  onEdit?: () => void;
  isReadOnly?: boolean;
  sortBy?: MatchSortByType;
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = {
  VICTORIA: 'V',
  DERROTA: 'D',
  EMPATE: 'E',
};

const MatchCard: React.FC<MatchCardProps> = ({ match, allMatches, allPlayers, onDelete, onEdit, isReadOnly = false, sortBy }) => {
  const { theme } = useTheme();
  const { playerProfile } = useData();
  const { result, myGoals, myAssists, date, notes, tournament, matchMode } = match;
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');

  const formattedDate = useMemo(() => {
    const dateObj = parseLocalDate(date);
    return {
        day: dateObj.toLocaleDateString('es-ES', { day: '2-digit' }),
        month: dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toLowerCase(),
        year: dateObj.toLocaleDateString('es-ES', { year: 'numeric' }),
    };
  }, [date]);

  const matchForm = useMemo(() => {
    const contextualMatches = allMatches.filter(m => 
      m.matchMode === match.matchMode && m.tournament === match.tournament
    ).sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

    const currentIndex = contextualMatches.findIndex(m => m.id === match.id);
    if (currentIndex < 0) return [];
    
    const startIndex = Math.max(0, currentIndex - 5);
    const formMatches = contextualMatches.slice(startIndex, currentIndex);
    
    return formMatches.map(m => m.result);
  }, [match.id, match.matchMode, match.tournament, allMatches]);

  const handleShare = async () => {
    setShareStatus('copying');
    
    const matchYear = parseLocalDate(match.date).getFullYear();
    const yearlyMatches = allMatches.filter(m => parseLocalDate(m.date).getFullYear() === matchYear);
    
    const yearlyWins = yearlyMatches.filter(m => m.result === 'VICTORIA').length;
    const yearlyDraws = yearlyMatches.filter(m => m.result === 'EMPATE').length;
    const yearlyLosses = yearlyMatches.filter(m => m.result === 'DERROTA').length;
    const yearlyGoals = yearlyMatches.reduce((sum, m) => sum + m.myGoals, 0);
    const yearlyAssists = yearlyMatches.reduce((sum, m) => sum + m.myAssists, 0);

    const resultIcons = { VICTORIA: '✅', EMPATE: '🟰', DERROTA: '❌' };
    const resultTextMap = {
      VICTORIA: 'ganado',
      DERROTA: 'perdido',
      EMPATE: 'empatado'
    };
    const resultText = resultTextMap[match.result];

    const textToCopy = `Partido ${resultText} ${resultIcons[match.result]}
⚽️ ${match.myGoals}
👟 ${match.myAssists}

Acumulado
✅ ${yearlyWins}
🟰 ${yearlyDraws}
❌ ${yearlyLosses}

⚽️ ${yearlyGoals}
👟 ${yearlyAssists}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setShareStatus('copied');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setShareStatus('error');
    } finally {
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };
  
  const getShareButtonText = () => {
    switch (shareStatus) {
      case 'copying': return 'Copiando...';
      case 'copied': return '¡Copiado!';
      case 'error': return 'Error';
      default: return 'Compartir Partido';
    }
  };


  const getResultStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    const baseStyle = styles.resultBadge;
    switch (result) {
      case 'VICTORIA':
        return { ...baseStyle, backgroundColor: `${theme.colors.win}26`, color: theme.colors.win, border: `1px solid ${theme.colors.win}80` };
      case 'DERROTA':
        return { ...baseStyle, backgroundColor: `${theme.colors.loss}26`, color: theme.colors.loss, border: `1px solid ${theme.colors.loss}80` };
      case 'EMPATE':
        return { ...baseStyle, backgroundColor: `${theme.colors.draw}33`, color: theme.colors.draw, border: `1px solid ${theme.colors.draw}80` };
    }
  };

  const getGoalDifferenceBadgeStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    const baseStyle = styles.statBadge;
    switch (result) {
      case 'VICTORIA':
        return { ...baseStyle, backgroundColor: `${theme.colors.win}26`, color: theme.colors.win };
      case 'DERROTA':
        return { ...baseStyle, backgroundColor: `${theme.colors.loss}26`, color: theme.colors.loss };
      case 'EMPATE':
        return { ...baseStyle, backgroundColor: `${theme.colors.draw}33`, color: theme.colors.draw };
    }
  };

  const getBorderColorFromResult = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): string => {
    switch (result) {
      case 'VICTORIA': return theme.colors.win;
      case 'DERROTA': return theme.colors.loss;
      case 'EMPATE': return theme.colors.draw;
    }
  };
  
  const actionButtonStyle: React.CSSProperties = {
    background: 'transparent', fontSize: theme.typography.fontSize.extraSmall, fontWeight: 600, cursor: 'pointer',
    padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`, borderRadius: theme.borderRadius.small,
    transition: 'color 0.2s, background-color 0.2s, border-color 0.2s', display: 'flex', alignItems: 'center', gap: theme.spacing.small,
  };

  const styles: { [key: string]: React.CSSProperties } = {
    card: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.medium, transition: 'background-color 0.2s, box-shadow 0.2s, border-color 0.3s',
      border: `1px solid ${getBorderColorFromResult(result)}`,
    },
    mainInfoRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${theme.spacing.medium} ${theme.spacing.large}`,
        gap: theme.spacing.medium,
    },
    toggleRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${theme.spacing.small} ${theme.spacing.large}`,
        borderTop: `1px solid ${theme.colors.border}`,
        cursor: 'pointer',
        backgroundColor: theme.colors.background,
        borderBottomLeftRadius: isExpanded ? 0 : theme.borderRadius.large,
        borderBottomRightRadius: isExpanded ? 0 : theme.borderRadius.large,
    },
    mainInfoLeft: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium, flex: 1, minWidth: 0 },
    resultBadge: {
      fontSize: theme.typography.fontSize.large, fontWeight: 700,
      borderRadius: theme.borderRadius.medium,
      width: '40px', height: '40px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    statsContainer: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium },
    statBadge: {
      backgroundColor: theme.colors.background, padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`, 
      borderRadius: theme.borderRadius.small, display: 'flex', alignItems: 'center', gap: theme.spacing.small,
      transition: 'opacity 0.3s ease-in-out',
    },
    statValue: { fontSize: '1.1rem', fontWeight: 700, color: theme.colors.primaryText, lineHeight: 1.1 },
    dateContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: theme.colors.primaryText,
        lineHeight: 1.2,
        fontSize: '8pt',
        fontWeight: 600,
        flexShrink: 0,
    },
    dateDay: {
        fontSize: '1.5em',
        fontWeight: 700,
        color: theme.colors.primaryText,
    },
    dateMonth: {
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    dateYear: {
        opacity: 0.6,
    },
    cardBody: {
      padding: theme.spacing.large, paddingTop: theme.spacing.medium,
    },
    actionsContainer: {
      display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
      gap: theme.spacing.medium, marginTop: theme.spacing.large,
      flexWrap: 'wrap',
    },
    actionButton: actionButtonStyle,
    notesSection: { marginBottom: theme.spacing.large },
    sectionHeading: {
      fontSize: theme.typography.fontSize.extraSmall, fontWeight: 700, color: theme.colors.draw, textTransform: 'uppercase',
      letterSpacing: '0.05em', margin: `0 0 ${theme.spacing.small} 0`, display: 'flex', alignItems: 'center', gap: theme.spacing.small,
    },
    notesText: { fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' },
    shareContainer: {
      display: 'flex',
      justifyContent: 'center',
      padding: `${theme.spacing.medium} 0 0 0`,
    },
    shareButton: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.small,
        background: 'transparent',
        border: `1px solid ${theme.colors.accent2}`,
        color: theme.colors.accent2,
        padding: `${theme.spacing.small} ${theme.spacing.large}`,
        borderRadius: theme.borderRadius.medium,
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: theme.typography.fontSize.small,
        transition: 'background-color 0.2s, color 0.2s, border-color 0.2s, opacity 0.2s',
        minWidth: '130px',
        justifyContent: 'center',
    },
    playersSection: { borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.large, marginTop: theme.spacing.large },
    playersGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.large },
    playerList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    playerListItem: {
        fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, backgroundColor: theme.colors.background,
        padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`, borderRadius: theme.borderRadius.small,
        border: `1px solid ${theme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    playerName: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
    },
    playerStatBadge: {
        backgroundColor: theme.colors.border,
        color: theme.colors.secondaryText,
        padding: '2px 6px',
        borderRadius: theme.borderRadius.small,
        fontSize: '0.7rem',
        fontWeight: 600,
        marginLeft: theme.spacing.small
    },
    highlightedPlayer: {
        fontWeight: 'bold',
        color: theme.colors.accent1,
    },
    teamLabel: {
        fontSize: theme.typography.fontSize.small, fontWeight: 600, color: theme.colors.secondaryText,
        margin: `0 0 ${theme.spacing.small} 0`,
    },
    tournamentTag: {
        backgroundColor: 'transparent',
        border: '1px solid', // color is set inline
        padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`,
        borderRadius: theme.borderRadius.small,
        fontSize: theme.typography.fontSize.extraSmall,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        maxWidth: '120px',
    },
    modeTag: {
        padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`,
        borderRadius: theme.borderRadius.small,
        fontSize: theme.typography.fontSize.extraSmall,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    campaignBanner: {
        backgroundColor: `${theme.colors.accent1}15`,
        borderRadius: theme.borderRadius.medium,
        padding: `${theme.spacing.small} ${theme.spacing.medium}`,
        marginBottom: theme.spacing.large,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.small,
        border: `1px solid ${theme.colors.accent1}30`,
    },
    campaignText: {
        fontSize: theme.typography.fontSize.extraSmall,
        fontWeight: 700,
        color: theme.colors.primaryText,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    }
  };
  
  const resultStyle = getResultStyle(result);

  const goalsBadgeStyle: React.CSSProperties = { ...styles.statBadge };
  const assistsBadgeStyle: React.CSSProperties = { ...styles.statBadge };

  if (sortBy?.startsWith('goals')) {
    assistsBadgeStyle.opacity = 0.5;
  } else if (sortBy?.startsWith('assists')) {
    goalsBadgeStyle.opacity = 0.5;
  }
  
  const shareButtonStyle = { ...styles.shareButton };
  if (shareStatus === 'copied') {
      shareButtonStyle.backgroundColor = `${theme.colors.win}20`;
      shareButtonStyle.borderColor = theme.colors.win;
      shareButtonStyle.color = theme.colors.win;
  } else if (shareStatus === 'error') {
      shareButtonStyle.backgroundColor = `${theme.colors.loss}20`;
      shareButtonStyle.borderColor = theme.colors.loss;
      shareButtonStyle.color = theme.colors.loss;
  } else if (shareStatus === 'copying') {
      shareButtonStyle.opacity = 0.7;
  }

  const allTeamPlayers = useMemo(() => {
    const mainPlayer = { name: playerProfile.name || 'Yo', goals: match.myGoals, assists: match.myAssists };
    const otherTeammates = (match.myTeamPlayers || []).filter(p => p.name.toLowerCase() !== (playerProfile.name || '').toLowerCase());
    return [mainPlayer, ...otherTeammates];
  }, [playerProfile.name, match.myGoals, match.myAssists, match.myTeamPlayers]);

  const renderTournamentTag = () => {
      const iconSize = 14;
      const isCareer = matchMode === 'world-cup' || matchMode === 'qualifiers';

      if (isCareer) {
          const bgColor = matchMode === 'world-cup' ? theme.colors.accent1 : theme.colors.accent2;
          const label = tournament || (matchMode === 'world-cup' ? 'Mundial' : 'Eliminatorias');
          return (
            <span style={{...styles.modeTag, backgroundColor: bgColor, color: theme.colors.textOnAccent}}>
                <PlayerIcon size={iconSize} color={theme.colors.textOnAccent} />
                <span>{label}</span>
            </span>
          );
      }

      if (tournament) {
          return <span style={{...styles.tournamentTag, borderColor: getColorForString(tournament), color: getColorForString(tournament) }} title={tournament}>{tournament}</span>;
      }
      return null;
  };

  return (
    <div style={styles.card}>
      <div style={styles.mainInfoRow}>
        <div style={styles.mainInfoLeft}>
          <span style={resultStyle}>{resultAbbreviations[result]}</span>
          <div style={styles.statsContainer}>
            <div style={goalsBadgeStyle}>
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚽️</span>
              <span style={styles.statValue}>{myGoals}</span>
            </div>
            <div style={assistsBadgeStyle}>
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>👟</span>
              <span style={styles.statValue}>{myAssists}</span>
            </div>
            {match.goalDifference !== undefined && match.result !== 'EMPATE' && match.goalDifference !== 0 && (
              <div style={getGoalDifferenceBadgeStyle(result)}>
                <span style={{...styles.statValue, color: 'inherit'}}>
                  {match.goalDifference > 0 ? `+${match.goalDifference}` : match.goalDifference}
                </span>
              </div>
            )}
          </div>
        </div>
        <div style={styles.dateContainer}>
            <span style={styles.dateDay}>{formattedDate.day}</span>
            <span style={styles.dateMonth}>{formattedDate.month}</span>
            <span style={styles.dateYear}>{formattedDate.year}</span>
        </div>
      </div>
      <div style={styles.toggleRow} onClick={() => setIsExpanded(!isExpanded)} role="button" tabIndex={0} aria-expanded={isExpanded}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.medium, minWidth: 0 }}>
            {renderTournamentTag()}
            {matchForm.length > 0 && <MatchFormIndicator form={matchForm} />}
        </div>
        <ChevronIcon isExpanded={isExpanded} />
      </div>
      
      {isExpanded && (
        <div style={{ ...styles.cardBody, animation: 'fadeIn 0.5s ease-in-out' }}>
            {notes && (
              <div style={styles.notesSection}>
                <h4 style={styles.sectionHeading}>Notas</h4>
                <p style={styles.notesText}>{notes}</p>
              </div>
            )}

            {matchMode && matchMode !== 'regular' && (
                <div style={styles.campaignBanner}>
                    <PlayerIcon size={16} color={theme.colors.accent1} />
                    <span style={styles.campaignText}>
                        {matchMode === 'world-cup' ? 'MODO CARRERA: MUNDIAL' : 'MODO CARRERA: ELIMINATORIAS'}
                        {tournament ? ` — ${tournament}` : ''}
                    </span>
                </div>
            )}

            {(allTeamPlayers.length > 1 || match.opponentPlayers?.length) ? (
              <div style={styles.playersSection}>
                <h4 style={styles.sectionHeading}><TeamIcon /> Alineaciones</h4>
                <div style={styles.playersGrid}>
                  <div>
                    <h5 style={styles.teamLabel}>Mi equipo</h5>
                    <ul style={styles.playerList}>
                        {allTeamPlayers.map((player, index) => (
                            <li key={index} style={player.name.toLowerCase() === playerProfile.name?.toLowerCase() ? {...styles.playerListItem, ...styles.highlightedPlayer} : styles.playerListItem}>
                              <span style={styles.playerName}>{player.name}</span>
                              <div>
                                {player.goals > 0 && <span style={styles.playerStatBadge}>⚽️ {player.goals}</span>}
                                {player.assists > 0 && <span style={styles.playerStatBadge}>👟 {player.assists}</span>}
                              </div>
                            </li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <h5 style={styles.teamLabel}>Equipo rival</h5>
                    <ul style={styles.playerList}>
                        {match.opponentPlayers?.map((player, index) => (
                          <li key={index} style={styles.playerListItem}>
                              <span style={styles.playerName}>{player.name}</span>
                              <div>
                                {player.goals > 0 && <span style={styles.playerStatBadge}>⚽️ {player.goals}</span>}
                                {player.assists > 0 && <span style={styles.playerStatBadge}>👟 {player.assists}</span>}
                              </div>
                          </li>
                        ))}
                        {(!match.opponentPlayers || match.opponentPlayers.length === 0) && <li style={{...styles.playerListItem, color: theme.colors.secondaryText, fontStyle: 'italic'}}>No hay jugadores</li>}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
            
            {!isReadOnly && (
              <div style={styles.shareContainer}>
                  <button
                      onClick={handleShare}
                      style={shareButtonStyle}
                      disabled={shareStatus !== 'idle'}
                  >
                      <ShareIcon />
                      <span>{getShareButtonText()}</span>
                  </button>
              </div>
            )}
             <div style={styles.actionsContainer}>
                {!isReadOnly && (
                  <>
                    <button onClick={onEdit} style={{...styles.actionButton, border: `1px solid ${theme.colors.draw}`, color: theme.colors.secondaryText}} aria-label="Editar partido">EDITAR</button>
                    <button onClick={onDelete} style={{...styles.actionButton, border: `1px solid ${theme.colors.loss}80`, color: theme.colors.loss}} aria-label="Eliminar partido">
                      <TrashIcon />
                    </button>
                  </>
                )}
             </div>
        </div>
      )}
      <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
      `}</style>
    </div>
  );
};

export default MatchCard;

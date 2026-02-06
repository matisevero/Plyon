
import React, { useState, useMemo, useEffect } from 'react';
import type { Match, MatchSortByType, PublicProfile } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { ChevronIcon } from './icons/ChevronIcon';
import { TrashIcon } from './icons/TrashIcon';
import { TeamIcon } from './icons/TeamIcon';
import MatchFormIndicator from './MatchFormIndicator';
import { ShareIcon } from './icons/ShareIcon';
import { parseLocalDate, getColorForString, CONFEDERATIONS, WORLD_CUP_LOGO } from '../utils/analytics';
import { TrophyIcon } from './icons/TrophyIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { FootballIcon } from './icons/FootballIcon';
import { getFriendsList } from '../services/firebaseService';
import FriendProfileModal from './modals/FriendProfileModal';
import ShareMatchOptionsModal from './modals/ShareMatchOptionsModal';
import { useHaptics } from '../hooks/useHaptics';

interface MatchCardProps {
  match: Match;
  allMatches: Match[];
  allPlayers: string[];
  onDelete?: () => void;
  onEdit?: () => void;
  isReadOnly?: boolean;
  sortBy?: MatchSortByType;
  forceExpanded?: boolean;
  isExpanded?: boolean; // New prop for controlled state
  onToggle?: () => void; // New prop for controlled toggling
  hideShareButton?: boolean;
  hideCareerBanner?: boolean;
  showFooterLogo?: boolean;
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = {
  VICTORIA: 'V',
  DERROTA: 'D',
  EMPATE: 'E',
};

const MatchCard: React.FC<MatchCardProps> = ({ 
    match, allMatches, allPlayers, onDelete, onEdit, 
    isReadOnly = false, sortBy, forceExpanded = false, 
    isExpanded: isExpandedProp, onToggle,
    hideShareButton = false,
    hideCareerBanner = false, showFooterLogo = false
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const { playerProfile } = useData();
  const { result, myGoals, myAssists, date, notes, tournament } = match;
  
  const [internalExpanded, setInternalExpanded] = useState(forceExpanded);
  
  // Use controlled state if provided, otherwise internal
  const isExpanded = isExpandedProp !== undefined ? isExpandedProp : internalExpanded;

  const handleToggle = () => {
      if (forceExpanded) return;
      if (onToggle) {
          onToggle();
      } else {
          haptics.light();
          setInternalExpanded(!internalExpanded);
      }
  };
  
  // Estado para controlar si la imagen falló al cargar
  const [imgError, setImgError] = useState(false);

  // Estados para modales
  const [selectedFriend, setSelectedFriend] = useState<PublicProfile | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Manejo de clic en jugador
  const handlePlayerClick = async (playerName: string) => {
      // Si es solo lectura (ej: en la imagen generada), no hacemos nada
      if (isReadOnly) return;
      
      haptics.light();

      const mappedUid = playerProfile.playerMappings?.[playerName];
      if (mappedUid) {
          try {
              // Obtener el perfil completo del amigo
              const profiles = await getFriendsList([mappedUid]);
              if (profiles.length > 0) {
                  setSelectedFriend(profiles[0]);
              }
          } catch (e) {
              console.error("Error al cargar perfil de amigo", e);
          }
      }
  };

  // --- DETECCIÓN DE MODO CARRERA POR FECHA ---
  const careerInfo = useMemo(() => {
      const matchTimestamp = parseLocalDate(date).getTime();

      // 1. Active Qualifiers
      if (playerProfile.activeWorldCupMode === 'qualifiers' && playerProfile.qualifiersProgress) {
          const activeStart = parseLocalDate(playerProfile.qualifiersProgress.startDate || '').getTime();
          if (matchTimestamp >= activeStart) {
               return { 
                   type: 'qualifiers', 
                   label: `${playerProfile.qualifiersProgress.confederation} #${playerProfile.qualifiersProgress.campaignNumber}`,
                   confederation: playerProfile.qualifiersProgress.confederation
               };
          }
      }

      // 2. Active World Cup
      if (playerProfile.activeWorldCupMode === 'campaign' && playerProfile.worldCupProgress) {
          const activeStart = parseLocalDate(playerProfile.worldCupProgress.startDate).getTime();
          if (matchTimestamp >= activeStart) {
               return { type: 'world-cup', label: `Mundial #${playerProfile.worldCupProgress.campaignNumber}` };
          }
      }

      // 3. Historical Data
      if (playerProfile.worldCupHistory) {
          const wcHistoryMatch = playerProfile.worldCupHistory.find(h => {
              const start = parseLocalDate(h.startDate).getTime();
              const end = parseLocalDate(h.endDate).getTime();
              return matchTimestamp >= start && matchTimestamp <= end;
          });
          if (wcHistoryMatch) return { type: 'world-cup', label: `Mundial #${wcHistoryMatch.campaignNumber}` };
      }

      if (playerProfile.qualifiersHistory) {
          const qualHistoryMatch = playerProfile.qualifiersHistory.find(h => {
              const start = parseLocalDate(h.startDate).getTime();
              const end = parseLocalDate(h.endDate).getTime();
              return matchTimestamp >= start && matchTimestamp <= end;
          });
          if (qualHistoryMatch) {
              const confName = qualHistoryMatch.confederation;
              return { 
                  type: 'qualifiers', 
                  label: `${confName} #${qualHistoryMatch.campaignNumber}`,
                  confederation: confName
              };
          }
      }

      return null;
  }, [date, playerProfile]);

  const hasExplicitTournament = tournament && tournament.trim() !== '';
  const isCareerMatch = !!careerInfo; 
  const isWorldCup = isCareerMatch && careerInfo?.type === 'world-cup';
  
  // Resetear error de imagen si cambia el contexto
  useEffect(() => {
      setImgError(false);
  }, [careerInfo]);
  // ---------------------------------------------

  const formattedDate = useMemo(() => {
    const dateObj = parseLocalDate(date);
    return {
        day: dateObj.toLocaleDateString('es-ES', { day: '2-digit' }),
        month: dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toLowerCase(),
        year: dateObj.toLocaleDateString('es-ES', { year: 'numeric' }),
    };
  }, [date]);

  const matchForm = useMemo(() => {
    const contextualMatches = allMatches.filter(m => {
        return m.tournament === match.tournament;
    }).sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

    const currentIndex = contextualMatches.findIndex(m => m.id === match.id);
    if (currentIndex < 0) return [];
    
    const startIndex = Math.max(0, currentIndex - 5);
    const formMatches = contextualMatches.slice(startIndex, currentIndex);
    
    return formMatches.map(m => m.result);
  }, [match.id, match.tournament, allMatches]);

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
        cursor: forceExpanded ? 'default' : 'pointer', // Disable cursor if forced expanded
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
      padding: theme.spacing.large,
      // Reduced padding top when forced expanded to minimize whitespace
      paddingTop: forceExpanded ? '4px' : theme.spacing.medium,
      // For static generation, ensure it's visible without animation delay
      animation: forceExpanded ? 'none' : 'fadeIn 0.5s ease-in-out', 
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
    playersSection: { 
        borderTop: `1px solid ${theme.colors.border}`, 
        paddingTop: theme.spacing.large,
        // Reduced margin top when forced expanded
        marginTop: forceExpanded ? theme.spacing.small : theme.spacing.large,
    },
    playersGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.large },
    playerList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    playerListItem: {
        fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, backgroundColor: theme.colors.background,
        padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`, borderRadius: theme.borderRadius.small,
        border: `1px solid ${theme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'border-color 0.2s ease',
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
    linkedPlayerItem: {
        borderColor: theme.colors.accent2,
        backgroundColor: `${theme.colors.accent2}10`,
        cursor: isReadOnly ? 'default' : 'pointer', // Disable pointer if read-only
    },
    teamLabel: {
        fontSize: theme.typography.fontSize.small, fontWeight: 600, color: theme.colors.secondaryText,
        margin: `0 0 ${theme.spacing.small} 0`,
    },
    tournamentTag: {
        borderRadius: theme.borderRadius.small,
        padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`,
        fontSize: theme.typography.fontSize.extraSmall,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        maxWidth: '140px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        border: '1px solid transparent',
    },
    careerIconBadge: {
        width: '24px',
        height: '24px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginRight: theme.spacing.extraSmall,
    },
    careerLogo: {
        width: '100%',
        height: '100%',
        objectFit: 'contain'
    },
    campaignDetailContainer: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.medium,
        padding: theme.spacing.medium,
        marginBottom: theme.spacing.large,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.medium,
        border: `1px solid ${theme.colors.borderStrong}`,
    },
    campaignIconContainer: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        flexShrink: 0,
        padding: '6px',
    },
    campaignInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    campaignLabel: {
        fontSize: '0.65rem',
        fontWeight: 700,
        color: theme.colors.secondaryText,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    campaignTitle: {
        fontSize: '0.9rem',
        fontWeight: 700,
        color: theme.colors.primaryText,
        margin: 0,
    },
    campaignInstance: {
        fontSize: '0.8rem',
        fontWeight: 600,
        color: theme.colors.secondaryText
    },
    footerLogo: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '6px',
        opacity: 0.6,
        fontSize: '0.8rem',
        fontWeight: 600,
        marginTop: theme.spacing.medium,
        paddingTop: theme.spacing.medium,
        borderTop: `1px dashed ${theme.colors.border}`,
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
  
  const allTeamPlayers = useMemo(() => {
    const mainPlayer = { name: playerProfile.name || 'Yo', goals: match.myGoals, assists: match.myAssists };
    const otherTeammates = (match.myTeamPlayers || []).filter(p => p.name.toLowerCase() !== (playerProfile.name || '').toLowerCase());
    return [mainPlayer, ...otherTeammates];
  }, [playerProfile.name, match.myGoals, match.myAssists, match.myTeamPlayers]);

  const renderCareerBanner = () => {
      // Don't render if explicitly hidden
      if (hideCareerBanner) return null;

      // Only render full banner if it IS a career match detected by date
      if (!isCareerMatch || !careerInfo) return null;

      // NOTE: Even if tournament name exists, we allow Career Banner in expanded view for context if desired.
      // But typically if user overrode it, maybe hide? 
      // Current logic: Show career banner inside details ALWAYS if date matches context, regardless of tournament tag overriding.

      let logoUrl = '';
      let color = theme.colors.primaryText;
      let typeLabel = 'MODO CARRERA';

      if (isWorldCup) {
          logoUrl = WORLD_CUP_LOGO[theme.name];
          color = theme.colors.accent1;
          typeLabel = 'COPA DEL MUNDO';
      } else if (careerInfo.confederation) {
          // @ts-ignore
          logoUrl = CONFEDERATIONS[careerInfo.confederation]?.logo[theme.name] || '';
          color = theme.colors.accent2;
          typeLabel = 'ELIMINATORIAS';
      }

      const DefaultIcon = isWorldCup ? TrophyIcon : GlobeIcon;

      return (
        <div style={styles.campaignDetailContainer}>
            <div style={styles.campaignIconContainer}>
               {logoUrl && !imgError ? (
                   <img 
                        src={logoUrl} 
                        alt="Logo" 
                        style={styles.careerLogo} 
                        onError={() => setImgError(true)}
                   />
               ) : (
                   <DefaultIcon size={24} color={color} />
               )}
            </div>
            <div style={styles.campaignInfo}>
                <span style={styles.campaignLabel}>{typeLabel}</span>
                <h4 style={styles.campaignTitle}>{careerInfo.label}</h4>
            </div>
        </div>
      );
  };

  // Logic to determine what tag to display
  let tagLabel = null;
  let tagStyle = {};

  // ONLY show tag if user explicitly entered a tournament name
  if (hasExplicitTournament) {
      tagLabel = tournament;
      const color = getColorForString(tagLabel);
      tagStyle = {
          ...styles.tournamentTag,
          backgroundColor: 'transparent',
          border: `1px solid ${color}`,
          color: color,
      };
  } 

  return (
    <>
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
        <div 
            style={styles.toggleRow} 
            onClick={handleToggle} 
            role="button" tabIndex={0} aria-expanded={isExpanded}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.medium, minWidth: 0, flex: 1 }}>
                
                {/* Show Career Icon if it matches the date criteria, acting as a small badge (visual cue only) */}
                {isCareerMatch && careerInfo && !hideCareerBanner && (
                    <div 
                        style={{
                            ...styles.careerIconBadge, 
                            backgroundColor: isWorldCup ? theme.colors.accent1 : theme.colors.accent2, 
                            color: theme.colors.textOnAccent 
                        }} 
                        title={careerInfo.label}
                    >
                        {isWorldCup ? <TrophyIcon size={14} /> : <GlobeIcon size={14} />}
                    </div>
                )}

                {tagLabel && (
                    <span style={tagStyle} title={tagLabel}>
                        {tagLabel}
                    </span>
                )}

                {matchForm.length > 0 && <MatchFormIndicator form={matchForm} />}
            </div>
            {!forceExpanded && <ChevronIcon isExpanded={isExpanded} />}
        </div>
        
        {isExpanded && (
            <div style={styles.cardBody}>
                {notes && (
                <div style={styles.notesSection}>
                    <h4 style={styles.sectionHeading}>Notas</h4>
                    <p style={styles.notesText}>{notes}</p>
                </div>
                )}

                {renderCareerBanner()}

                {(allTeamPlayers.length > 1 || match.opponentPlayers?.length) ? (
                <div style={styles.playersSection}>
                    <h4 style={styles.sectionHeading}><TeamIcon /> Alineaciones</h4>
                    <div style={styles.playersGrid}>
                    <div>
                        <h5 style={styles.teamLabel}>Mi equipo</h5>
                        <ul style={styles.playerList}>
                            {allTeamPlayers.map((player, index) => {
                                const isLinked = !!playerProfile.playerMappings?.[player.name];
                                const isMe = player.name.toLowerCase() === playerProfile.name?.toLowerCase();
                                
                                return (
                                    <li 
                                        key={index} 
                                        style={{
                                            ...styles.playerListItem, 
                                            ...(isMe ? styles.highlightedPlayer : {}),
                                            ...(isLinked ? styles.linkedPlayerItem : {})
                                        }}
                                        onClick={() => isLinked && handlePlayerClick(player.name)}
                                        title={isLinked && !isReadOnly ? "Ver perfil de amigo" : ""}
                                    >
                                    <span style={styles.playerName}>
                                        {player.name}
                                    </span>
                                    <div>
                                        {player.goals > 0 && <span style={styles.playerStatBadge}>⚽️ {player.goals}</span>}
                                        {player.assists > 0 && <span style={styles.playerStatBadge}>👟 {player.assists}</span>}
                                    </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div>
                        <h5 style={styles.teamLabel}>Equipo rival</h5>
                        <ul style={styles.playerList}>
                            {match.opponentPlayers?.map((player, index) => {
                            const isLinked = !!playerProfile.playerMappings?.[player.name];
                            return (
                                <li 
                                    key={index} 
                                    style={{
                                        ...styles.playerListItem,
                                        ...(isLinked ? styles.linkedPlayerItem : {})
                                    }}
                                    onClick={() => isLinked && handlePlayerClick(player.name)}
                                    title={isLinked && !isReadOnly ? "Ver perfil de amigo" : ""}
                                >
                                    <span style={styles.playerName}>
                                        {player.name}
                                    </span>
                                    <div>
                                    {player.goals > 0 && <span style={styles.playerStatBadge}>⚽️ {player.goals}</span>}
                                    {player.assists > 0 && <span style={styles.playerStatBadge}>👟 {player.assists}</span>}
                                    </div>
                                </li>
                            );
                            })}
                            {(!match.opponentPlayers || match.opponentPlayers.length === 0) && <li style={{...styles.playerListItem, color: theme.colors.secondaryText, fontStyle: 'italic'}}>No hay jugadores</li>}
                        </ul>
                    </div>
                    </div>
                </div>
                ) : null}
                
                {showFooterLogo && (
                    <div style={styles.footerLogo}>
                        <FootballIcon size={16} /> Plyon
                    </div>
                )}

                {!isReadOnly && !hideShareButton && (
                <div style={styles.shareContainer}>
                    <button
                        onClick={() => { haptics.medium(); setIsShareModalOpen(true); }}
                        style={styles.shareButton}
                    >
                        <ShareIcon />
                        <span>Compartir</span>
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

        {selectedFriend && <FriendProfileModal isOpen={!!selectedFriend} onClose={() => setSelectedFriend(null)} friend={selectedFriend} />}
        <ShareMatchOptionsModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} match={match} allMatches={allMatches} />
    </>
  );
};

export default MatchCard;

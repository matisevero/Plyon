
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
import s from './MatchCard.module.css';

interface MatchCardProps {
  match: Match;
  allMatches: Match[];
  allPlayers: string[];
  onDelete?: () => void;
  onEdit?: () => void;
  isReadOnly?: boolean;
  sortBy?: MatchSortByType;
  forceExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
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
  
  const [imgError, setImgError] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<PublicProfile | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handlePlayerClick = async (playerName: string) => {
      if (isReadOnly) return;
      haptics.light();
      const mappedUid = playerProfile.playerMappings?.[playerName];
      if (mappedUid) {
          try {
              const profiles = await getFriendsList([mappedUid]);
              if (profiles.length > 0) {
                  setSelectedFriend(profiles[0]);
              }
          } catch (e) {
              console.error("Error al cargar perfil de amigo", e);
          }
      }
  };

  const careerInfo = useMemo(() => {
      const matchTimestamp = parseLocalDate(date).getTime();
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
      if (playerProfile.activeWorldCupMode === 'campaign' && playerProfile.worldCupProgress) {
          const activeStart = parseLocalDate(playerProfile.worldCupProgress.startDate).getTime();
          if (matchTimestamp >= activeStart) {
               return { type: 'world-cup', label: `Mundial #${playerProfile.worldCupProgress.campaignNumber}` };
          }
      }
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
  
  useEffect(() => {
      setImgError(false);
  }, [careerInfo]);

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

  const getBorderColor = (r: 'VICTORIA' | 'DERROTA' | 'EMPATE'): string => {
    switch (r) {
      case 'VICTORIA': return theme.colors.win;
      case 'DERROTA': return theme.colors.loss;
      case 'EMPATE': return theme.colors.draw;
    }
  };

  const getResultBadgeStyle = (r: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    switch (r) {
      case 'VICTORIA':
        return { backgroundColor: `${theme.colors.win}26`, color: theme.colors.win, border: `1px solid ${theme.colors.win}80` };
      case 'DERROTA':
        return { backgroundColor: `${theme.colors.loss}26`, color: theme.colors.loss, border: `1px solid ${theme.colors.loss}80` };
      case 'EMPATE':
        return { backgroundColor: `${theme.colors.draw}33`, color: theme.colors.draw, border: `1px solid ${theme.colors.draw}80` };
    }
  };

  const getGoalDifferenceBadgeStyle = (r: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    switch (r) {
      case 'VICTORIA':
        return { backgroundColor: `${theme.colors.win}26`, color: theme.colors.win };
      case 'DERROTA':
        return { backgroundColor: `${theme.colors.loss}26`, color: theme.colors.loss };
      case 'EMPATE':
        return { backgroundColor: `${theme.colors.draw}33`, color: theme.colors.draw };
    }
  };

  const goalsBadgeOpacity = sortBy?.startsWith('goals') ? {} : sortBy?.startsWith('assists') ? { opacity: 0.5 } : {};
  const assistsBadgeOpacity = sortBy?.startsWith('assists') ? {} : sortBy?.startsWith('goals') ? { opacity: 0.5 } : {};
  
  const allTeamPlayers = useMemo(() => {
    const mainPlayer = { name: playerProfile.name || 'Yo', goals: match.myGoals, assists: match.myAssists };
    const otherTeammates = (match.myTeamPlayers || []).filter(p => p.name.toLowerCase() !== (playerProfile.name || '').toLowerCase());
    return [mainPlayer, ...otherTeammates];
  }, [playerProfile.name, match.myGoals, match.myAssists, match.myTeamPlayers]);

  const renderCareerBanner = () => {
      if (hideCareerBanner) return null;
      if (!isCareerMatch || !careerInfo) return null;

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
        <div className={s.campaignDetailContainer}>
            <div className={s.campaignIconContainer}>
               {logoUrl && !imgError ? (
                   <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className={s.careerLogo} 
                        onError={() => setImgError(true)}
                   />
               ) : (
                   <DefaultIcon size={24} color={color} />
               )}
            </div>
            <div className={s.campaignInfo}>
                <span className={s.campaignLabel}>{typeLabel}</span>
                <h4 className={s.campaignTitle}>{careerInfo.label}</h4>
            </div>
        </div>
      );
  };

  let tagLabel: string | null = null;
  let tagStyle: React.CSSProperties = {};

  if (hasExplicitTournament) {
      tagLabel = tournament;
      const color = getColorForString(tagLabel);
      tagStyle = {
          backgroundColor: 'transparent',
          border: `1px solid ${color}`,
          color: color,
      };
  } 

  const toggleRowClasses = [
    s.toggleRow,
    !forceExpanded ? s.toggleRowClickable : '',
    !isExpanded ? s.toggleRowCollapsed : '',
  ].filter(Boolean).join(' ');

  const cardBodyClasses = [
    s.cardBody,
    forceExpanded ? s.cardBodyForceExpanded : '',
  ].filter(Boolean).join(' ');

  const playersSectionClasses = [
    s.playersSection,
    forceExpanded ? s.playersSectionForceExpanded : '',
  ].filter(Boolean).join(' ');

  return (
    <>
        <div className={s.card} style={{ border: `1px solid ${getBorderColor(result)}` }}>
        <div className={s.mainInfoRow}>
            <div className={s.mainInfoLeft}>
            <span className={s.resultBadge} style={getResultBadgeStyle(result)}>{resultAbbreviations[result]}</span>
            <div className={s.statsContainer}>
                <div className={s.statBadge} style={goalsBadgeOpacity}>
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{'⚽️'}</span>
                <span className={s.statValue}>{myGoals}</span>
                </div>
                <div className={s.statBadge} style={assistsBadgeOpacity}>
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{'👟'}</span>
                <span className={s.statValue}>{myAssists}</span>
                </div>
                {match.goalDifference !== undefined && match.result !== 'EMPATE' && match.goalDifference !== 0 && (
                <div className={s.statBadge} style={getGoalDifferenceBadgeStyle(result)}>
                    <span className={s.statValue} style={{ color: 'inherit' }}>
                    {match.goalDifference > 0 ? `+${match.goalDifference}` : match.goalDifference}
                    </span>
                </div>
                )}
            </div>
            </div>
            <div className={s.dateContainer}>
                <span className={s.dateDay}>{formattedDate.day}</span>
                <span className={s.dateMonth}>{formattedDate.month}</span>
                <span className={s.dateYear}>{formattedDate.year}</span>
            </div>
        </div>
        <div 
            className={toggleRowClasses}
            onClick={handleToggle} 
            role="button" tabIndex={0} aria-expanded={isExpanded}
        >
            <div className={s.toggleMetaRow}>
                {isCareerMatch && careerInfo && !hideCareerBanner && (
                    <div 
                        className={s.careerIconBadge}
                        style={{
                            backgroundColor: isWorldCup ? theme.colors.accent1 : theme.colors.accent2, 
                            color: theme.colors.textOnAccent 
                        }} 
                        title={careerInfo.label}
                    >
                        {isWorldCup ? <TrophyIcon size={14} /> : <GlobeIcon size={14} />}
                    </div>
                )}
                {tagLabel && (
                    <span className={s.tournamentTag} style={tagStyle} title={tagLabel}>
                        {tagLabel}
                    </span>
                )}
                {matchForm.length > 0 && <MatchFormIndicator form={matchForm} />}
            </div>
            {!forceExpanded && <ChevronIcon isExpanded={isExpanded} />}
        </div>
        
        {isExpanded && (
            <div className={cardBodyClasses}>
                {notes && (
                <div className={s.notesSection}>
                    <h4 className={s.sectionHeading}>Notas</h4>
                    <p className={s.notesText}>{notes}</p>
                </div>
                )}

                {renderCareerBanner()}

                {(allTeamPlayers.length > 1 || match.opponentPlayers?.length) ? (
                <div className={playersSectionClasses}>
                    <h4 className={s.sectionHeading}><TeamIcon /> Alineaciones</h4>
                    <div className={s.playersGrid}>
                    <div>
                        <h5 className={s.teamLabel}>Mi equipo</h5>
                        <ul className={s.playerList}>
                            {allTeamPlayers.map((player, index) => {
                                const isLinked = !!playerProfile.playerMappings?.[player.name];
                                const isMe = player.name.toLowerCase() === playerProfile.name?.toLowerCase();
                                
                                return (
                                    <li 
                                        key={index} 
                                        className={`${s.playerListItem} ${isMe ? s.highlightedPlayer : ''} ${isLinked ? s.linkedPlayerItem : ''} ${isLinked && !isReadOnly ? s.linkedPlayerItemClickable : ''}`}
                                        onClick={() => isLinked && handlePlayerClick(player.name)}
                                        title={isLinked && !isReadOnly ? "Ver perfil de amigo" : ""}
                                    >
                                    <span className={s.playerName}>
                                        {player.name}
                                    </span>
                                    <div>
                                        {player.goals > 0 && <span className={s.playerStatBadge}>{'⚽️'} {player.goals}</span>}
                                        {player.assists > 0 && <span className={s.playerStatBadge}>{'👟'} {player.assists}</span>}
                                    </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div>
                        <h5 className={s.teamLabel}>Equipo rival</h5>
                        <ul className={s.playerList}>
                            {match.opponentPlayers?.map((player, index) => {
                            const isLinked = !!playerProfile.playerMappings?.[player.name];
                            return (
                                <li 
                                    key={index} 
                                    className={`${s.playerListItem} ${isLinked ? s.linkedPlayerItem : ''} ${isLinked && !isReadOnly ? s.linkedPlayerItemClickable : ''}`}
                                    onClick={() => isLinked && handlePlayerClick(player.name)}
                                    title={isLinked && !isReadOnly ? "Ver perfil de amigo" : ""}
                                >
                                    <span className={s.playerName}>
                                        {player.name}
                                    </span>
                                    <div>
                                    {player.goals > 0 && <span className={s.playerStatBadge}>{'⚽️'} {player.goals}</span>}
                                    {player.assists > 0 && <span className={s.playerStatBadge}>{'👟'} {player.assists}</span>}
                                    </div>
                                </li>
                            );
                            })}
                            {(!match.opponentPlayers || match.opponentPlayers.length === 0) && <li className={s.playerListItem} style={{ color: theme.colors.secondaryText, fontStyle: 'italic' }}>No hay jugadores</li>}
                        </ul>
                    </div>
                    </div>
                </div>
                ) : null}
                
                {showFooterLogo && (
                    <div className={s.footerLogo}>
                        <FootballIcon size={16} /> Plyon
                    </div>
                )}

                {!isReadOnly && !hideShareButton && (
                <div className={s.shareContainer}>
                    <button
                        onClick={() => { haptics.medium(); setIsShareModalOpen(true); }}
                        className={s.shareButton}
                    >
                        <ShareIcon />
                        <span>Compartir</span>
                    </button>
                </div>
                )}
                <div className={s.actionsContainer}>
                    {!isReadOnly && (
                    <>
                        <button onClick={onEdit} className={s.actionButton} style={{ border: `1px solid ${theme.colors.draw}`, color: theme.colors.secondaryText }} aria-label="Editar partido">EDITAR</button>
                        <button onClick={onDelete} className={s.actionButton} style={{ border: `1px solid ${theme.colors.loss}80`, color: theme.colors.loss }} aria-label="Eliminar partido">
                        <TrashIcon />
                        </button>
                    </>
                    )}
                </div>
            </div>
        )}
        </div>

        {selectedFriend && <FriendProfileModal isOpen={!!selectedFriend} onClose={() => setSelectedFriend(null)} friend={selectedFriend} />}
        <ShareMatchOptionsModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} match={match} allMatches={allMatches} />
    </>
  );
};

export default MatchCard;

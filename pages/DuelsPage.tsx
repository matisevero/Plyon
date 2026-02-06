
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Match, TeammateStats, OpponentStats } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { UsersIcon } from '../components/icons/UsersIcon';
import AutocompleteInput from '../components/AutocompleteInput';
import PlayerDuelModal from '../components/modals/PlayerDuelModal';
import { InfoIcon } from '../components/icons/InfoIcon';
import PlayerCompareModal from '../components/modals/PlayerCompareModal';
import { parseLocalDate } from '../utils/analytics';
import SegmentedControl from '../components/common/SegmentedControl';
import { useTutorial } from '../hooks/useTutorial';
import TutorialModal from '../components/modals/TutorialModal';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import YearFilter from '../components/YearFilter';
import { ShareIcon } from '../components/icons/ShareIcon';
import ShareViewModal from '../components/modals/ShareViewModal';
import { UserIcon } from '../components/icons/UserIcon';
import SectionHelp from '../components/common/SectionHelp';

type TeammateSortKey = keyof TeammateStats;
type OpponentSortKey = keyof OpponentStats;

interface PlayerHistoricalStats {
    name: string;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    winRate: number;
    efectividad: number;
    goals: number;
    assists: number;
}
type PlayerSortKey = keyof PlayerHistoricalStats;

interface SortItem<T> {
    key: T;
    order: 'asc' | 'desc';
}

const LinkedUserBadge: React.FC = () => {
    const { theme } = useTheme();
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '6px', verticalAlign: 'middle', flexShrink: 0, color: theme.colors.accent2 }} title="Jugador vinculado"> <UserIcon size={12} /> </span>
    );
};

const InsightList: React.FC<{ title: string; description: string; players: (TeammateStats | OpponentStats)[]; color: string; onPlayerClick: (playerName: string) => void; limit?: number; onViewMore?: () => void; }> = ({ title, description, players, color, onPlayerClick, limit, onViewMore }) => {
    const { theme } = useTheme();
    const { playerProfile } = useData();
    const [isExpanded, setIsExpanded] = useState(false);
    const getRankIndicator = (change: 'up' | 'down' | 'same' | 'new') => { const style = { fontWeight: 'bold', display: 'inline-block', width: '12px', textAlign: 'center' as 'center' }; switch (change) { case 'up': return <span style={{ ...style, color: theme.colors.win }}>▲</span>; case 'down': return <span style={{ ...style, color: theme.colors.loss }}>▼</span>; case 'same': return <span style={{ ...style, color: theme.colors.secondaryText }}>—</span>; case 'new': return <span style={{ ...style, color: theme.colors.accent2 }}>●</span>; default: return <span style={style}></span>; } };
    const getPodiumStyle = (index: number): React.CSSProperties => { if (index === 0) return { fontWeight: 900, fontSize: '1.1rem' }; if (index === 1) return { fontWeight: 700, fontSize: '1.05rem' }; if (index === 2) return { fontWeight: 700, fontSize: '1.0rem' }; return {}; };
    const styles = { insightList: { margin: 0, padding: 0, display: 'flex', flexDirection: 'column' as 'column', gap: theme.spacing.small, }, insightListItem: { background: 'none', border: 'none', width: '100%', padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, textAlign: 'left' as 'left', borderRadius: theme.borderRadius.small, transition: 'background-color 0.2s', cursor: 'pointer', }, playerRankInfo: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium, }, rankText: { width: '28px', textAlign: 'center' as 'center', }, playerName: { whiteSpace: 'nowrap' as 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center' }, winRateBadge: { color: theme.colors.secondaryText, fontSize: '0.75rem', fontWeight: 500, flexShrink: 0, }, insightScore: { fontWeight: 600, padding: `2px 6px`, borderRadius: theme.borderRadius.small, fontSize: '0.75rem', }, viewMore: { background: 'none', border: 'none', width: '100%', textAlign: 'center' as 'center', fontSize: '0.8rem', color: theme.colors.accent2, fontWeight: 600, cursor: 'pointer', padding: theme.spacing.small, marginTop: theme.spacing.extraSmall } };
    if (players.length === 0) { return ( <div style={{ padding: theme.spacing.medium, color: theme.colors.secondaryText, fontStyle: 'italic', textAlign: 'center' }}> No hay suficientes datos para mostrar esta estadística. </div> ) };
    const displayPlayers = (limit && !isExpanded) ? players.slice(0, limit) : players;
    const hasMore = limit && players.length > limit;
    const handleViewMore = (e: React.MouseEvent) => { e.stopPropagation(); setIsExpanded(true); if (onViewMore) onViewMore(); };
    return ( <div style={styles.insightList}> {displayPlayers.map((p, index) => { const podiumStyle = getPodiumStyle(index); const isLinked = !!playerProfile.playerMappings?.[p.name]; return ( <button key={p.name} style={styles.insightListItem} onClick={() => onPlayerClick(p.name)} className="table-row"> <div style={styles.playerRankInfo}> {getRankIndicator(p.rankChange)} <span style={{...styles.rankText, ...podiumStyle}}> {index + 1}. </span> </div> <div style={{ flex: 1, minWidth: 0, padding: `0 ${theme.spacing.small}` }}> <div style={{ ...styles.playerName, ...podiumStyle }}> <span>{p.name}</span> {isLinked && <LinkedUserBadge />} </div> </div> <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.medium }}> <span style={styles.winRateBadge}>{p.winRate.toFixed(0)}% V</span> <span style={{ ...styles.insightScore, backgroundColor: `${color}25`, color: color }}> {p.impactScore.toFixed(2)} </span> </div> </button> ) })} {hasMore && !isExpanded && ( <button onClick={handleViewMore} style={styles.viewMore}> Ver {players.length - limit} más </button> )} {isExpanded && limit && players.length > limit && ( <button onClick={() => setIsExpanded(false)} style={styles.viewMore}> Ver menos </button> )} </div> );
};

export const DuelsPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, playerProfile, isShareMode } = useData();
  const { isTutorialSeen, markTutorialAsSeen } = useTutorial('duels');
  const [activeTab, setActiveTab] = useState<'teammates' | 'opponents' | 'players'>('teammates');
  const [filteredByPlayer, setFilteredByPlayer] = useState<string | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isTutorialOpen, setIsTutorialOpen] = useState(!isTutorialSeen && !isShareMode);
  
  // Sync tutorial state
  useEffect(() => {
      if (isTutorialSeen) setIsTutorialOpen(false);
  }, [isTutorialSeen]);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [teammateSort, setTeammateSort] = useState<SortItem<TeammateSortKey>[]>([]);
  const [opponentSort, setOpponentSort] = useState<SortItem<OpponentSortKey>[]>([]);
  const [playerSort, setPlayerSort] = useState<SortItem<PlayerSortKey>[]>([]);
  const [isMultiSortMode, setIsMultiSortMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isCompareHovered, setIsCompareHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');
  
  // Carousel State & Touch Logic
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      setTeammateSort([{ key: 'matchesPlayed', order: 'desc' }]);
      setOpponentSort([{ key: 'matchesPlayed', order: 'desc' }]);
      setPlayerSort([{ key: 'matchesPlayed', order: 'desc' }]);
  }, []);

  const availableYears = useMemo(() => {
      const matchesWithPlayers = matches.filter(m => (m.myTeamPlayers && m.myTeamPlayers.length > 0) || (m.opponentPlayers && m.opponentPlayers.length > 0));
      const yearSet = new Set(matchesWithPlayers.map(m => parseLocalDate(m.date).getFullYear()));
      return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [matches]);

  const filteredMatches = useMemo(() => {
      if (selectedYear === 'all') return matches;
      return matches.filter(m => parseLocalDate(m.date).getFullYear().toString() === selectedYear);
  }, [matches, selectedYear]);

  const tutorialSteps = [
    {
        title: 'Red de JUGADORES',
        content: 'Analiza tu rendimiento según quién te rodea. Detecta con quién ganas más y contra quién sufres más en el campo.',
        icon: <UsersIcon size={48} />,
    },
    {
        title: 'Índice de impacto',
        content: 'Nuestra métrica exclusiva. Evalúa cuánto mejora o empeora tu éxito (Resultados y Goles) según la presencia de cada jugador.',
        icon: <TrendingUpIcon size={48} />,
    },
    {
        title: 'Cara a cara',
        content: "Usa el botón 'Comparar' para enfrentar las estadísticas de hasta 3 jugadores simultáneamente y zanjar debates.",
        icon: <SearchIcon size={48} />,
    }
  ];

  const duelsGuide = [
      { title: "Duelos", content: "Analiza tu rendimiento según quién te rodea. Detecta con quién ganas más y contra quién sufres más en el campo.", icon: <UsersIcon size={48} /> },
      { title: "Índice de Impacto", content: "Mide cuánto mejora (o empeora) tu rendimiento cuando cierto jugador está en la cancha.", icon: <TrendingUpIcon size={48} /> }
  ];

  const hasPlayerData = useMemo(() => filteredMatches.some(m => (m.myTeamPlayers && m.myTeamPlayers.length > 0) || (m.opponentPlayers && m.opponentPlayers.length > 0)), [filteredMatches]);
  const allDuelPlayers = useMemo(() => { const players = new Set<string>(); matches.forEach(match => { match.myTeamPlayers?.forEach(p => { if (p && p.name.trim() && p.name.toLowerCase() !== playerProfile.name?.toLowerCase()) players.add(p.name.trim()); }); match.opponentPlayers?.forEach(p => { if (p && p.name.trim()) players.add(p.name.trim()); }); }); return Array.from(players).sort(); }, [matches, playerProfile.name]);
  
  useEffect(() => { const handleResize = () => setIsDesktop(window.innerWidth >= 992); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);

  const { teammates, opponents, insights, players } = useMemo(() => {
      const calculateStatsForMatches = (matchList: Match[]) => {
          const CONFIDENCE_FACTOR = 5;
          const TEAMMATE_WIN_SCORE = 3, TEAMMATE_DRAW_SCORE = 1, TEAMMATE_LOSS_SCORE = -1;
          const MY_GOAL_WITH_TEAMMATE_SCORE = 1.5, MY_ASSIST_WITH_TEAMMATE_SCORE = 1;
          const OPPONENT_WIN_SCORE = 3, OPPONENT_DRAW_SCORE = 1, OPPONENT_LOSS_SCORE = -2;
          const MY_GOAL_AGAINST_OPPONENT_SCORE = 1.5, MY_ASSIST_AGAINST_OPPONENT_SCORE = 1;
          const GOAL_DIFFERENCE_SCORE = 0.25;
          const TEAMMATE_GOAL_SCORE = 0.75;
          const TEAMMATE_ASSIST_SCORE = 0.5;
          const OPPONENT_GOAL_SCORE = -0.75;
          const OPPONENT_ASSIST_SCORE = -0.5;
          const teammateData: Record<string, any> = {};
          const opponentData: Record<string, any> = {};
          matchList.forEach(match => {
              match.myTeamPlayers?.forEach(player => {
                  if (player.name.toLowerCase() === playerProfile.name?.toLowerCase() || !player.name.trim()) return;
                  if (!teammateData[player.name]) teammateData[player.name] = { matches: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, totalImpactScore: 0, ownGoals: 0, ownAssists: 0, matchesList: [] };
                  const data = teammateData[player.name];
                  data.matches++;
                  if (match.result === 'VICTORIA') data.wins++; else if (match.result === 'EMPATE') data.draws++; else data.losses++;
                  data.goals += match.myGoals; data.assists += match.myAssists;
                  data.ownGoals += player.goals; data.ownAssists += player.assists;
                  let matchScore = 0;
                  if (match.result === 'VICTORIA') matchScore += TEAMMATE_WIN_SCORE; else if (match.result === 'EMPATE') matchScore += TEAMMATE_DRAW_SCORE; else matchScore += TEAMMATE_LOSS_SCORE;
                  matchScore += match.myGoals * MY_GOAL_WITH_TEAMMATE_SCORE;
                  matchScore += match.myAssists * MY_ASSIST_WITH_TEAMMATE_SCORE;
                  matchScore += (match.goalDifference || 0) * GOAL_DIFFERENCE_SCORE;
                  matchScore += player.goals * TEAMMATE_GOAL_SCORE;
                  matchScore += player.assists * TEAMMATE_ASSIST_SCORE;
                  data.totalImpactScore += matchScore;
                  data.matchesList.push(match);
              });
              match.opponentPlayers?.forEach(player => {
                  if (!player.name.trim()) return;
                  if (!opponentData[player.name]) opponentData[player.name] = { matches: 0, wins: 0, draws: 0, losses: 0, myGoals: 0, myAssists: 0, totalImpactScore: 0, ownGoals: 0, ownAssists: 0, matchesList: [] };
                  const data = opponentData[player.name];
                  data.matches++;
                  if (match.result === 'VICTORIA') data.wins++; else if (match.result === 'EMPATE') data.draws++; else data.losses++;
                  data.myGoals += match.myGoals; data.myAssists += match.myAssists;
                  data.ownGoals += player.goals; data.ownAssists += player.assists;
                  let matchScore = 0;
                  if (match.result === 'VICTORIA') matchScore += OPPONENT_WIN_SCORE; else if (match.result === 'EMPATE') matchScore += OPPONENT_DRAW_SCORE; else matchScore += OPPONENT_LOSS_SCORE;
                  matchScore += match.myGoals * MY_GOAL_AGAINST_OPPONENT_SCORE;
                  matchScore += match.myAssists * MY_ASSIST_AGAINST_OPPONENT_SCORE;
                  matchScore += (match.goalDifference || 0) * GOAL_DIFFERENCE_SCORE;
                  matchScore += player.goals * OPPONENT_GOAL_SCORE;
                  matchScore += player.assists * OPPONENT_ASSIST_SCORE;
                  data.totalImpactScore += matchScore;
                  data.matchesList.push(match);
              });
          });
          const finalTeammates: Omit<TeammateStats, 'rankChange'>[] = Object.entries(teammateData).map(([name, data]) => ({ name, matchesPlayed: data.matches, winRate: data.matches > 0 ? (data.wins / data.matches) * 100 : 0, totalGoals: data.ownGoals, totalAssists: data.ownAssists, gpm: data.matches > 0 ? data.goals / data.matches : 0, apm: data.matches > 0 ? data.assists / data.matches : 0, record: { wins: data.wins, draws: data.draws, losses: data.losses }, totalContributions: data.ownGoals + data.ownAssists, contributionsPerMatch: data.matches > 0 ? (data.ownGoals + data.ownAssists) / data.matches : 0, impactScore: data.matches > 0 ? data.totalImpactScore / (data.matches + CONFIDENCE_FACTOR) : 0, ownGoals: data.ownGoals, ownAssists: data.ownAssists, matches: data.matchesList, points: data.wins * 3 + data.draws, myGoals: data.goals, myAssists: data.assists, }));
          const finalOpponents: Omit<OpponentStats, 'rankChange'>[] = Object.entries(opponentData).map(([name, data]) => ({ name, matchesPlayed: data.matches, winRate: data.matches > 0 ? (data.wins / data.matches) * 100 : 0, record: { wins: data.wins, draws: data.draws, losses: data.losses }, myTotalContributions: data.myGoals + data.myAssists, myContributionsPerMatch: data.matches > 0 ? (data.myGoals + data.myAssists) / data.matches : 0, impactScore: data.matches > 0 ? data.totalImpactScore / (data.matches + CONFIDENCE_FACTOR) : 0, ownGoals: data.ownGoals, ownAssists: data.ownAssists, matches: data.matchesList, points: data.wins * 3 + data.draws, myGoals: data.myGoals, myAssists: data.myAssists, gpm: data.matches > 0 ? data.myGoals / data.matches : 0, apm: data.matches > 0 ? data.myAssists / data.matches : 0, }));
          return { teammates: finalTeammates, opponents: finalOpponents };
      };
      const allStats = calculateStatsForMatches(filteredMatches);
      let previousStats: ReturnType<typeof calculateStatsForMatches> | null = null;
      if (filteredMatches.length > 1) {
          const sortedMatchesByDate = [...filteredMatches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
          previousStats = calculateStatsForMatches(sortedMatchesByDate.slice(1));
      }
      const augmentWithRankChange = <T extends { name: string; impactScore: number }>(currentItems: T[], previousItems: T[] | null): (T & { rankChange: 'up' | 'down' | 'same' | 'new' })[] => {
          const sortedCurrent = [...currentItems].sort((a, b) => b.impactScore - a.impactScore);
          const sortedPrevious = previousItems ? [...previousItems].sort((a, b) => b.impactScore - a.impactScore) : [];
          const prevRankMap = new Map<string, number>();
          sortedPrevious.forEach((p, i) => prevRankMap.set(p.name, i));
          return sortedCurrent.map((item, i) => {
              const prevRank = prevRankMap.get(item.name);
              let rankChange: 'up' | 'down' | 'same' | 'new' = 'same';
              if (prevRank === undefined) rankChange = 'new';
              else if (i < prevRank) rankChange = 'up';
              else if (i > prevRank) rankChange = 'down';
              return { ...item, rankChange };
          });
      };
      const allTeammatesWithRank = augmentWithRankChange(allStats.teammates, previousStats?.teammates || []);
      const allOpponentsWithRank = augmentWithRankChange(allStats.opponents, previousStats?.opponents || []);
      const allInsights = { bestPartners: allTeammatesWithRank, worstPartners: [...allTeammatesWithRank].sort((a, b) => a.impactScore - b.impactScore), favoriteRivals: allOpponentsWithRank, nemesisRivals: [...allOpponentsWithRank].sort((a, b) => a.impactScore - b.impactScore), };
      const historicalPlayerData: Record<string, { matchesPlayed: number; wins: number; draws: number; losses: number; goals: number; assists: number; }> = {};
      const allPlayersSet = new Set<string>();
      filteredMatches.forEach(match => {
          match.myTeamPlayers?.forEach(p => { if (p && p.name.trim() && p.name.toLowerCase() !== playerProfile.name?.toLowerCase()) allPlayersSet.add(p.name.trim()); });
          match.opponentPlayers?.forEach(p => { if (p && p.name.trim()) allPlayersSet.add(p.name.trim()); });
      });
      allPlayersSet.forEach(player => {
          historicalPlayerData[player] = { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0 };
          filteredMatches.forEach(match => {
              const playerOnMyTeam = match.myTeamPlayers?.find(p => p.name === player);
              const playerOnOpponentTeam = match.opponentPlayers?.find(p => p.name === player);
              if (playerOnMyTeam) {
                  historicalPlayerData[player].matchesPlayed++;
                  if (match.result === 'VICTORIA') historicalPlayerData[player].wins++; else if (match.result === 'EMPATE') historicalPlayerData[player].draws++; else historicalPlayerData[player].losses++;
                  historicalPlayerData[player].goals += playerOnMyTeam.goals; historicalPlayerData[player].assists += playerOnMyTeam.assists;
              } else if (playerOnOpponentTeam) {
                  historicalPlayerData[player].matchesPlayed++;
                  if (match.result === 'VICTORIA') historicalPlayerData[player].losses++; else if (match.result === 'EMPATE') historicalPlayerData[player].draws++; else historicalPlayerData[player].wins++;
                  historicalPlayerData[player].goals += playerOnOpponentTeam.goals; historicalPlayerData[player].assists += playerOnOpponentTeam.assists;
              }
          });
      });
      let finalPlayers: PlayerHistoricalStats[] = Object.entries(historicalPlayerData).map(([name, data]) => { const points = data.wins * 3 + data.draws; return { name, ...data, points, winRate: data.matchesPlayed > 0 ? (data.wins / data.matchesPlayed) * 100 : 0, efectividad: data.matchesPlayed > 0 ? (points / (data.matchesPlayed * 3)) * 100 : 0, }; });
      if (filteredByPlayer) {
          return { teammates: allTeammatesWithRank.filter(p => p.name === filteredByPlayer), opponents: allOpponentsWithRank.filter(p => p.name === filteredByPlayer), players: finalPlayers.filter(p => p.name === filteredByPlayer), insights: { bestPartners: allInsights.bestPartners.filter(p => p.name === filteredByPlayer), worstPartners: allInsights.worstPartners.filter(p => p.name === filteredByPlayer), favoriteRivals: allInsights.favoriteRivals.filter(p => p.name === filteredByPlayer), nemesisRivals: allInsights.nemesisRivals.filter(p => p.name === filteredByPlayer), } };
      }
      return { teammates: allTeammatesWithRank, opponents: allOpponentsWithRank, insights: allInsights, players: finalPlayers };
  }, [filteredMatches, filteredByPlayer, playerProfile.name]);

  const insightSlides = useMemo(() => [
      { id: 'bestPartners', title: "🤝 Mejores socios", description: "Compañeros con los que tu rendimiento se dispara.", players: insights.bestPartners, color: theme.colors.win, type: 'teammates' },
      { id: 'favoriteRivals', title: "⚔️ Rivales preferidos", description: "Contrincantes a los que sueles dominar.", players: insights.favoriteRivals, color: theme.colors.accent1, type: 'opponents' },
      { id: 'worstPartners', title: "⚠️ Socios complejos", description: "Compañeros con los que la química aún no fluye.", players: insights.worstPartners, color: theme.colors.draw, type: 'teammates' },
      { id: 'nemesisRivals', title: "👻 La Bestia Negra", description: "Rivales que históricamente te complican el partido.", players: insights.nemesisRivals, color: theme.colors.loss, type: 'opponents' },
  ], [insights, theme.colors]);
  
  // --- TOUCH HANDLERS ---
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
       if (currentSlide < insightSlides.length - 1) setCurrentSlide(currentSlide + 1);
    }
    if (isRightSwipe) {
       if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };
  
  // Also support mouse for testing on desktop
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleSort = <T extends string>( key: T, currentSort: SortItem<T>[], setSort: React.Dispatch<React.SetStateAction<SortItem<T>[]>> ) => { setSort(prev => { const existingIndex = prev.findIndex(item => item.key === key); if (isMultiSortMode) { if (existingIndex >= 0) { const newSort = [...prev]; newSort[existingIndex] = { ...newSort[existingIndex], order: newSort[existingIndex].order === 'desc' ? 'asc' : 'desc' }; return newSort; } else { const newSort = [...prev, { key, order: 'desc' as const }]; if (newSort.length > 3) newSort.shift(); return newSort; } } else { if (prev.length > 0 && prev[0].key === key) return [{ key, order: prev[0].order === 'desc' ? 'asc' : 'desc' }]; return [{ key, order: 'desc' }]; } }); };
  const getComparator = <T extends Record<string, any>>(sortConfig: SortItem<keyof T>[]) => { return (a: T, b: T) => { for (const sort of sortConfig) { const key = sort.key; const order = sort.order; let valA: any = a[key]; let valB: any = b[key]; if (key === 'record') { const pointsA = a.record.wins * 3 + a.record.draws; const pointsB = b.record.wins * 3 + b.record.draws; valA = pointsA; valB = pointsB; } if (typeof valA === 'string' && typeof valB === 'string') { const comparison = valA.localeCompare(valB); if (comparison !== 0) return order === 'asc' ? comparison : -comparison; } else if (typeof valA === 'number' && typeof valB === 'number') { if (valA < valB) return order === 'asc' ? -1 : 1; if (valA > valB) return order === 'asc' ? 1 : -1; } } return 0; }; };
  const sortedTeammates = useMemo(() => [...teammates].sort(getComparator(teammateSort)), [teammates, teammateSort]);
  const sortedOpponents = useMemo(() => [...opponents].sort(getComparator(opponentSort)), [opponents, opponentSort]);
  const sortedPlayers = useMemo(() => [...players].sort(getComparator(playerSort)), [players, playerSort]);
  const handleGlobalSearchChange = (value: string) => { setGlobalSearchTerm(value); const matchedPlayer = allDuelPlayers.find(p => p.toLowerCase() === value.toLowerCase()); if (matchedPlayer) { setFilteredByPlayer(matchedPlayer); setGlobalSearchTerm(''); } }
  const clearPlayerFilter = () => { setFilteredByPlayer(null); setGlobalSearchTerm(''); };
  const handlePlayerClick = (playerName: string) => { setSelectedPlayer(playerName); };
  const handleCloseModal = () => { setSelectedPlayer(null); };

  const styles: { [key: string]: React.CSSProperties } = { 
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.extraLarge }, 
    header: { display: 'flex', justifyContent: isDesktop ? 'space-between' : 'center', alignItems: isDesktop ? 'center' : 'flex-start', gap: '1rem', flexDirection: isDesktop ? 'row' : 'column', }, 
    titleContainer: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium, }, 
    infoButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', }, 
    headerButtons: { display: 'flex', alignItems: 'center', gap: theme.spacing.small, }, 
    headerActions: { display: 'flex', gap: theme.spacing.medium, alignItems: isDesktop ? 'center' : 'stretch', flexDirection: isDesktop ? 'row' : 'column', width: isDesktop ? 'auto' : '100%', }, 
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium, display: 'flex', alignItems: 'center' }, 
    contentWrapper: { display: isDesktop ? 'grid' : 'flex', flexDirection: 'column', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: theme.spacing.large, alignItems: 'start', width: '100%' }, 
    leftColumn: { position: isDesktop ? 'sticky' : 'static', top: `calc(65px + ${theme.spacing.extraLarge})`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large, minWidth: 0, width: '100%' }, 
    rightColumn: { minWidth: 0, width: '100%' }, 
    card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, boxShadow: theme.shadows.medium, border: `1px solid ${theme.colors.border}`, padding: theme.spacing.large, width: '100%', boxSizing: 'border-box' }, 
    searchContainer: { position: 'relative', width: '100%', maxWidth: isDesktop ? '400px' : 'none' }, 
    compareButton: { background: isCompareHovered ? theme.colors.accent1 : 'transparent', color: isCompareHovered ? theme.colors.textOnAccent : theme.colors.accent1, border: `1px solid ${theme.colors.accent1}`, padding: '0.5rem 1.5rem', borderRadius: theme.borderRadius.medium, cursor: 'pointer', fontWeight: 600, fontSize: theme.typography.fontSize.small, transition: 'background-color 0.2s, color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '200px' }, 
    tabContainer: { display: 'flex', marginBottom: theme.spacing.medium, alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.medium, flexWrap: 'wrap' }, 
    multiSortToggle: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.small, cursor: 'pointer', userSelect: 'none' as 'none', fontSize: '0.75rem', fontWeight: 700, color: theme.colors.secondaryText, padding: '6px 12px', borderRadius: '20px', border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface, width: isDesktop ? 'auto' : 'fit-content', margin: isDesktop ? '0 0 0 10px' : '10px auto 10px auto', transition: 'all 0.2s', }, 
    multiSortActive: { borderColor: theme.colors.accent2, color: theme.colors.textOnAccent, backgroundColor: theme.colors.accent2, }, 
    scrollWrapper: { position: 'relative' }, 
    tableContainer: { overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }, 
    table: { borderCollapse: 'collapse', width: '100%' }, 
    th: { padding: `${theme.spacing.small} ${theme.spacing.medium}`, textAlign: 'left', fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontWeight: 600, borderBottom: `2px solid ${theme.colors.borderStrong}`, cursor: 'pointer', whiteSpace: 'nowrap' }, 
    tr: { transition: 'background-color 0.2s' }, 
    td: { padding: `${theme.spacing.medium}`, fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, borderBottom: `1px solid ${theme.colors.border}`, whiteSpace: 'nowrap' }, 
    stickyColumn: { position: 'sticky', left: 0, backgroundColor: theme.colors.surface, borderRight: `1px solid ${theme.colors.borderStrong}`, }, 
    clickableCell: { cursor: 'pointer' }, 
    noDataContainer: { textAlign: 'center', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, color: theme.colors.secondaryText, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}` }, 
    noDataIcon: { marginBottom: theme.spacing.medium }, 
    noDataText: { margin: 0 }, 
    filterBanner: { backgroundColor: theme.colors.surface, padding: theme.spacing.medium, borderRadius: theme.borderRadius.medium, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${theme.colors.accent2}` }, 
    clearFilterButton: { background: 'none', border: `1px solid ${theme.colors.borderStrong}`, color: theme.colors.secondaryText, padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`, borderRadius: theme.borderRadius.small, cursor: 'pointer' }, 
    thContent: { display: 'flex', alignItems: 'center', gap: '0.25rem', }, 
    sortBadge: { fontSize: '0.65rem', fontWeight: 800, backgroundColor: theme.colors.accent2, color: theme.colors.textOnAccent, borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '2px' }, 
    insightsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: theme.spacing.medium, width: '100%' }, 
    tableNameContainer: { display: 'flex', alignItems: 'center' }, 
    
    // Updated Carousel Styles for Touch Swipe
    carouselContainer: { 
        display: 'flex', 
        flexDirection: 'column' as 'column', 
        alignItems: 'center', 
        justifyContent: 'flex-start',
        gap: theme.spacing.small, 
        backgroundColor: theme.colors.surface, 
        padding: 0, // Removed padding for cleaner swipe edge
        borderRadius: theme.borderRadius.large, 
        border: `1px solid ${theme.colors.border}`, 
        width: '100%', 
        boxShadow: theme.shadows.medium, 
        boxSizing: 'border-box',
        overflow: 'hidden', // Essential for masking slides
        position: 'relative' as 'relative'
    }, 
    carouselTrack: {
        display: 'flex',
        width: '100%',
        transition: 'transform 0.3s ease-out', // Smooth slide
    },
    carouselSlide: {
        minWidth: '100%',
        boxSizing: 'border-box',
        padding: theme.spacing.large,
        display: 'flex',
        flexDirection: 'column' as 'column',
    },
    insightTitle: { margin: 0, fontSize: theme.typography.fontSize.medium, fontWeight: 700, paddingBottom: theme.spacing.small, borderBottom: `1px solid ${theme.colors.border}`, }, 
    insightDescription: { 
        margin: `${theme.spacing.medium} 0 ${theme.spacing.small} 0`, 
        fontSize: theme.typography.fontSize.extraSmall, 
        color: theme.colors.secondaryText, 
        fontStyle: 'italic', 
    }, 
    paginationContainer: { display: 'flex', gap: '8px', padding: '10px 0 15px 0' }, 
    dot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.colors.borderStrong, border: 'none', cursor: 'pointer', padding: 0 }, 
    activeDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.colors.accent1, border: 'none', cursor: 'pointer', padding: 0 } 
  };

  const getSortIndicator = (key: any, currentSort: SortItem<any>[]) => { const index = currentSort.findIndex(s => s.key === key); if (index === -1) return ' '; return currentSort[index].order === 'desc' ? '↓' : '↑'; };
  const Th: React.FC<{ sortKey: TeammateSortKey | OpponentSortKey | PlayerSortKey; sortConfig: SortItem<any>[]; onSort: () => void; children: React.ReactNode; style?: React.CSSProperties; hasTooltip?: boolean; tooltipText?: string; }> = ({ sortKey, sortConfig, onSort, children, style, hasTooltip, tooltipText }) => { const [isHovered, setIsHovered] = useState(false); const { theme } = useTheme(); const sortIndex = sortConfig.findIndex(s => s.key === sortKey); const isActive = sortIndex !== -1; const isMulti = sortConfig.length > 1; return ( <th style={{ ...styles.th, ...style, color: isActive ? theme.colors.accent2 : styles.th.color, borderBottom: isActive ? `2px solid ${theme.colors.accent2}` : styles.th.borderBottom }} onClick={onSort} > <div style={styles.thContent}> <span>{children}</span> <span>{getSortIndicator(sortKey, sortConfig)}</span> {isActive && isMulti && ( <span style={styles.sortBadge}> {sortIndex + 1} </span> )} {hasTooltip && ( <div style={{position: 'relative', display: 'flex', alignItems: 'center'}} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} > <InfoIcon size={14}/> {isHovered && ( <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: '220px', padding: '0.5rem', backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`, borderRadius: '6px', boxShadow: theme.shadows.medium, zIndex: 10, fontSize: '0.75rem', color: theme.colors.primaryText, }}> {tooltipText} </div> )} </div> )} </div> </th> ); };
  const tabOptions = [ { label: 'Compañeros', value: 'teammates' }, { label: 'Rivales', value: 'opponents' }, { label: 'Jugadores', value: 'players' }, ];

  const mainContent = (
      <div style={{display: 'flex', flexDirection: 'column', gap: theme.spacing.large, width: '100%'}}>
          <div 
             style={styles.carouselContainer}
             onTouchStart={onTouchStart}
             onTouchMove={onTouchMove}
             onTouchEnd={onTouchEnd}
          >
              <div style={{...styles.carouselTrack, transform: `translateX(-${currentSlide * 100}%)`}}>
                  {insightSlides.map((slide, index) => (
                      <div key={index} style={styles.carouselSlide}>
                          <h4 style={{...styles.insightTitle, color: slide.color}}>{slide.title}</h4>
                          <p style={styles.insightDescription}>{slide.description}</p>
                          <InsightList 
                            title="" 
                            description="" 
                            players={slide.players} 
                            color={slide.color} 
                            onPlayerClick={handlePlayerClick} 
                            limit={5} 
                            onViewMore={() => setActiveTab(slide.type as any)} 
                          />
                      </div>
                  ))}
              </div>
              
              <div style={styles.paginationContainer}>
                  {insightSlides.map((_, index) => (
                      <button 
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        style={index === currentSlide ? styles.activeDot : styles.dot}
                      />
                  ))}
              </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => setIsCompareModalOpen(true)} style={styles.compareButton} onMouseEnter={() => setIsCompareHovered(true)} onMouseLeave={() => setIsCompareHovered(false)} > 
                <SearchIcon size={18} style={{marginRight: '8px'}}/> Comparar Jugadores 
            </button>
          </div>
      </div>
  );

  return (
    <>
      <TutorialModal isOpen={isTutorialOpen} onClose={(dontShowAgain) => { setIsTutorialOpen(false); if(dontShowAgain) markTutorialAsSeen(); }} steps={tutorialSteps} />
      <ShareViewModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} page="duels" />
      <main style={styles.container}>
          <div style={styles.header}>
            <div style={styles.titleContainer}>
              <h2 style={styles.pageTitle}>
                Análisis de duelos
                <SectionHelp steps={duelsGuide} />
              </h2>
              {!isShareMode && (
                  <div style={styles.headerButtons}>
                    <button onClick={() => setIsShareModalOpen(true)} style={styles.infoButton} aria-label="Compartir vista"><ShareIcon color={theme.colors.secondaryText} size={20} /></button>
                    <button onClick={() => setIsTutorialOpen(true)} style={styles.infoButton} aria-label="Mostrar guía"><InfoIcon color={theme.colors.secondaryText} size={20}/></button>
                  </div>
              )}
            </div>
            <div style={styles.headerActions}>
                <YearFilter years={availableYears} selectedYear={selectedYear} onSelectYear={setSelectedYear} size="small" />
                <div style={styles.searchContainer}> <AutocompleteInput value={globalSearchTerm} onChange={handleGlobalSearchChange} suggestions={allDuelPlayers} placeholder="Buscar y filtrar por jugador..." /> </div>
            </div>
          </div>
          {filteredByPlayer && ( <div style={styles.filterBanner}> <span>Mostrando informe de: <strong>{filteredByPlayer}</strong></span> <button onClick={clearPlayerFilter} style={styles.clearFilterButton}>Limpiar filtro</button> </div> )}
          {!hasPlayerData ? ( <div style={styles.noDataContainer}><div style={styles.noDataIcon}><UsersIcon size={40} /></div><p style={styles.noDataText}>Registra las alineaciones en tus partidos para desbloquear el scouting.</p></div> ) : (
              <div style={styles.contentWrapper}>
                  <div style={styles.leftColumn}>{mainContent}</div>
                  <div style={styles.rightColumn}>
                      <div style={styles.card}>
                          <div style={styles.tabContainer}>
                              <div style={{flex: 1}}>
                                  <SegmentedControl options={tabOptions} selectedValue={activeTab} onSelect={(value) => setActiveTab(value as 'teammates' | 'opponents' | 'players')} />
                              </div>
                              <div style={{...styles.multiSortToggle, ...(isMultiSortMode ? styles.multiSortActive : {})}} onClick={() => setIsMultiSortMode(!isMultiSortMode)} title="Activar para ordenar por múltiples columnas a la vez" > <span>ORDENAR</span> </div>
                          </div>
                          <div style={styles.scrollWrapper}>
                              <div style={styles.tableContainer} ref={scrollContainerRef} className="no-scrollbar">
                                  {activeTab === 'teammates' && (
                                      <table style={styles.table}>
                                          <thead>
                                              <tr>
                                                  <Th style={styles.stickyColumn} sortKey="name" sortConfig={teammateSort} onSort={() => handleSort('name', teammateSort, setTeammateSort)}>Nombre</Th>
                                                  <Th sortKey="record" sortConfig={teammateSort} onSort={() => handleSort('record', teammateSort, setTeammateSort)}>Récord</Th>
                                                  <Th sortKey="impactScore" sortConfig={teammateSort} onSort={() => handleSort('impactScore', teammateSort, setTeammateSort)} hasTooltip tooltipText="Mide el impacto general de este compañero. Considera los resultados del equipo, tus goles/asistencias, y también los goles/asistencias que este jugador aporta.">Índice</Th>
                                                  <Th sortKey="matchesPlayed" sortConfig={teammateSort} onSort={() => handleSort('matchesPlayed', teammateSort, setTeammateSort)}>PJ</Th>
                                                  <Th sortKey="winRate" sortConfig={teammateSort} onSort={() => handleSort('winRate', teammateSort, setTeammateSort)}>% Vic.</Th>
                                                  <Th sortKey="contributionsPerMatch" sortConfig={teammateSort} onSort={() => handleSort('contributionsPerMatch', teammateSort, setTeammateSort)}>G+A/P</Th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {sortedTeammates.map((p, index) => {
                                                  const isLinked = !!playerProfile.playerMappings?.[p.name];
                                                  const podiumStyle = (index < 3) ? { fontWeight: 'bold' } : {};
                                                  return (
                                                      <tr key={p.name} style={styles.tr} className="table-row">
                                                          <td style={{...styles.td, ...styles.clickableCell, ...podiumStyle, ...styles.stickyColumn}} className="sticky-column" onClick={() => handlePlayerClick(p.name)}>
                                                              <div style={styles.tableNameContainer}>
                                                                  <span>{p.name}</span> {isLinked && <LinkedUserBadge />}
                                                              </div>
                                                          </td>
                                                          <td style={styles.td}>{`${p.record.wins}-${p.record.draws}-${p.record.losses}`}</td>
                                                          <td style={{...styles.td, textAlign: 'center', fontWeight: 'bold', color: p.impactScore > 0 ? theme.colors.win : p.impactScore < 0 ? theme.colors.loss : theme.colors.primaryText}}>{p.impactScore.toFixed(2)}</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.matchesPlayed}</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.winRate.toFixed(1)}%</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.contributionsPerMatch.toFixed(2)}</td>
                                                      </tr>
                                                  );
                                              })}
                                          </tbody>
                                      </table>
                                  )}
                                  {activeTab === 'opponents' && (
                                      <table style={styles.table}>
                                          <thead>
                                              <tr>
                                                  <Th style={styles.stickyColumn} sortKey="name" sortConfig={opponentSort} onSort={() => handleSort('name', opponentSort, setOpponentSort)}>Nombre</Th>
                                                  <Th sortKey="record" sortConfig={opponentSort} onSort={() => handleSort('record', opponentSort, setOpponentSort)}>Récord</Th>
                                                  <Th sortKey="impactScore" sortConfig={opponentSort} onSort={() => handleSort('impactScore', opponentSort, setOpponentSort)} hasTooltip tooltipText="Mide tu rendimiento contra este rival. Considera los resultados del equipo, tus goles/asistencias, y también el impacto de los goles/asistencias de este jugador en tu contra.">Índice</Th>
                                                  <Th sortKey="matchesPlayed" sortConfig={opponentSort} onSort={() => handleSort('matchesPlayed', opponentSort, setOpponentSort)}>PJ</Th>
                                                  <Th sortKey="winRate" sortConfig={opponentSort} onSort={() => handleSort('winRate', opponentSort, setOpponentSort)}>% Vic.</Th>
                                                  <Th sortKey="myContributionsPerMatch" sortConfig={opponentSort} onSort={() => handleSort('myContributionsPerMatch', opponentSort, setOpponentSort)}>Mis G+A/P</Th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {sortedOpponents.map((p, index) => {
                                                  const isLinked = !!playerProfile.playerMappings?.[p.name];
                                                  const podiumStyle = (index < 3) ? { fontWeight: 'bold' } : {};
                                                  return (
                                                      <tr key={p.name} style={styles.tr} className="table-row">
                                                          <td style={{...styles.td, ...styles.clickableCell, ...podiumStyle, ...styles.stickyColumn}} className="sticky-column" onClick={() => handlePlayerClick(p.name)}>
                                                              <div style={styles.tableNameContainer}>
                                                                  <span>{p.name}</span> {isLinked && <LinkedUserBadge />}
                                                              </div>
                                                          </td>
                                                          <td style={styles.td}>{`${p.record.wins}-${p.record.draws}-${p.record.losses}`}</td>
                                                          <td style={{...styles.td, textAlign: 'center', fontWeight: 'bold', color: p.impactScore > 0 ? theme.colors.win : p.impactScore < 0 ? theme.colors.loss : theme.colors.primaryText}}>{p.impactScore.toFixed(2)}</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.matchesPlayed}</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.winRate.toFixed(1)}%</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.myContributionsPerMatch.toFixed(2)}</td>
                                                      </tr>
                                                  );
                                              })}
                                          </tbody>
                                      </table>
                                  )}
                                  {activeTab === 'players' && (
                                      <table style={styles.table}>
                                          <thead>
                                              <tr>
                                                  <Th style={styles.stickyColumn} sortKey="name" sortConfig={playerSort} onSort={() => handleSort('name', playerSort, setPlayerSort)}>Jugador</Th>
                                                  <Th sortKey="matchesPlayed" sortConfig={playerSort} onSort={() => handleSort('matchesPlayed', playerSort, setPlayerSort)}>PJ</Th>
                                                  <Th sortKey="wins" sortConfig={playerSort} onSort={() => handleSort('wins', playerSort, setPlayerSort)}>V</Th>
                                                  <Th sortKey="draws" sortConfig={playerSort} onSort={() => handleSort('draws', playerSort, setPlayerSort)}>E</Th>
                                                  <Th sortKey="losses" sortConfig={playerSort} onSort={() => handleSort('losses', playerSort, setPlayerSort)}>D</Th>
                                                  <Th sortKey="points" sortConfig={playerSort} onSort={() => handleSort('points', playerSort, setPlayerSort)}>Pts</Th>
                                                  <Th sortKey="goals" sortConfig={playerSort} onSort={() => handleSort('goals', playerSort, setPlayerSort)}>G</Th>
                                                  <Th sortKey="assists" sortConfig={playerSort} onSort={() => handleSort('assists', playerSort, setPlayerSort)}>A</Th>
                                                  <Th sortKey="efectividad" sortConfig={playerSort} onSort={() => handleSort('efectividad', playerSort, setPlayerSort)}>Efect.</Th>
                                                  <Th sortKey="winRate" sortConfig={playerSort} onSort={() => handleSort('winRate', playerSort, setPlayerSort)}>% Vic.</Th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {sortedPlayers.map((p, index) => {
                                                  const isLinked = !!playerProfile.playerMappings?.[p.name];
                                                  const podiumStyle = (index < 3) ? { fontWeight: 'bold' } : {};
                                                  return (
                                                      <tr key={p.name} style={styles.tr} className="table-row">
                                                          <td style={{...styles.td, ...styles.clickableCell, ...podiumStyle, ...styles.stickyColumn}} className="sticky-column" onClick={() => handlePlayerClick(p.name)}>
                                                              <div style={styles.tableNameContainer}>
                                                                  <span>{p.name}</span> {isLinked && <LinkedUserBadge />}
                                                              </div>
                                                          </td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.matchesPlayed}</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.wins}</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.draws}</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.losses}</td>
                                                          <td style={{...styles.td, textAlign: 'center', fontWeight: 'bold'}}>{p.points}</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.goals}</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.assists}</td>
                                                          <td style={{...styles.td, textAlign: 'center', fontWeight: 'bold'}}>{p.efectividad.toFixed(1)}%</td>
                                                          <td style={{...styles.td, textAlign: 'center'}}>{p.winRate.toFixed(1)}%</td>
                                                      </tr>
                                                  );
                                              })}
                                          </tbody>
                                      </table>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </main>
      {selectedPlayer && ( <PlayerDuelModal isOpen={!!selectedPlayer} onClose={handleCloseModal} playerName={selectedPlayer} allMatches={matches} /> )}
      <PlayerCompareModal isOpen={isCompareModalOpen} onClose={() => setIsCompareModalOpen(false)} allPlayers={allDuelPlayers} allMatches={matches} />
    </>
  );
};

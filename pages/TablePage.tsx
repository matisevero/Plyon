
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { TableIcon } from '../components/icons/TableIcon';
import RadarChart from '../components/charts/RadarChart';
import Card from '../components/common/Card';
import { parseLocalDate } from '../utils/analytics';
import { useTutorial } from '../hooks/useTutorial';
import TutorialModal from '../components/modals/TutorialModal';
import { ActivityIcon } from '../components/icons/ActivityIcon';
import { InfoIcon } from '../components/icons/InfoIcon';
import { ShareIcon } from '../components/icons/ShareIcon';
import ShareViewModal from '../components/modals/ShareViewModal';
import SectionHelp from '../components/common/SectionHelp';
import { TrophyIcon } from '../components/icons/TrophyIcon';

interface YearlyStats {
  year: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  winRate: number;
  efectividad: number;
  goals: number;
  assists: number;
  gpm: number;
  apm: number;
  contributions: number;
  cpm: number;
}

interface TournamentStats {
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
  gpm: number;
  apm: number;
  contributions: number;
  cpm: number;
}

const radarMetrics: { label: string; key: keyof YearlyStats }[] = [
    { label: 'PJ', key: 'matchesPlayed' },
    { label: 'V', key: 'wins' },
    { label: 'E', key: 'draws' },
    { label: 'D', key: 'losses' },
    { label: '%V', key: 'winRate' },
    { label: 'Efect.', key: 'efectividad' },
    { label: 'G', key: 'goals' },
    { label: 'A', key: 'assists' },
    { label: 'G/P', key: 'gpm' },
    { label: 'A/P', key: 'apm' },
];

const TablePage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, isShareMode } = useData();
  const { isTutorialSeen, markTutorialAsSeen } = useTutorial('table');
  const [sortConfig, setSortConfig] = useState<{ key: keyof YearlyStats; direction: 'asc' | 'desc' }>({ key: 'year', direction: 'desc' });
  const [tournamentSortConfig, setTournamentSortConfig] = useState<{ key: keyof TournamentStats; direction: 'asc' | 'desc' }>({ key: 'points', direction: 'desc' });
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const [visibleYears, setVisibleYears] = useState<Set<number>>(new Set());
  const [isTutorialOpen, setIsTutorialOpen] = useState(!isTutorialSeen && !isShareMode);
  
  // Sync tutorial state
  useEffect(() => {
      if (isTutorialSeen) setIsTutorialOpen(false);
  }, [isTutorialSeen]);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const yearlyTableRef = useRef<HTMLDivElement>(null);
  const [isYearlyTableScrollable, setIsYearlyTableScrollable] = useState(false);
  const tournamentTableRef = useRef<HTMLDivElement>(null);
  const [isTournamentTableScrollable, setIsTournamentTableScrollable] = useState(false);

  const tutorialSteps = [
    {
        title: 'TABLA anual',
        content: 'Tu carrera temporada a temporada. Analiza tus puntos, efectividad y promedios de gol en un formato de liga clásico.',
        icon: <TableIcon size={48} />,
    },
    {
        title: 'Perfil de RADAR',
        content: 'Visualiza tu estilo de juego. Activa o desactiva años en la leyenda para comparar tu evolución y detectar tus puntos fuertes.',
        icon: <ActivityIcon size={48} />,
    },
    {
        title: 'Récords históricos',
        content: 'En la parte superior verás tus mejores marcas históricas. Intenta superarlas en la temporada actual.',
        icon: <TableIcon size={48} />,
    }
  ];

  const tableGuide = [
      { title: "Tu carrera como liga", content: "Cada año cuenta como un equipo en una tabla de posiciones. Compara tus temporadas para ver cuándo tuviste tu 'Prime'.", icon: <TableIcon size={48} /> }
  ];

  const tournamentGuide = [
      { title: "Competencias", content: "Si etiquetas tus partidos con nombres de torneos, aquí verás el desglose específico de cada uno.", icon: <TrophyIcon size={48} /> }
  ];

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const yearlyData = useMemo(() => {
    const statsByYear: Record<number, Omit<YearlyStats, 'year' | 'winRate' | 'gpm' | 'apm' | 'contributions' | 'cpm' | 'efectividad'>> = {};
    matches.forEach(match => {
      const year = parseLocalDate(match.date).getFullYear();
      if (!statsByYear[year]) { statsByYear[year] = { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, points: 0, goals: 0, assists: 0 }; }
      const yearStats = statsByYear[year];
      yearStats.matchesPlayed++;
      if (match.result === 'VICTORIA') { yearStats.wins++; yearStats.points += 3; } else if (match.result === 'EMPATE') { yearStats.draws++; yearStats.points += 1; } else { yearStats.losses++; }
      yearStats.goals += match.myGoals; yearStats.assists += match.myAssists;
    });
    return Object.entries(statsByYear).map(([year, stats]) => {
      const { matchesPlayed, wins, goals, assists, points } = stats;
      const efectividad = matchesPlayed > 0 ? (points / (matchesPlayed * 3)) * 100 : 0;
      return { ...stats, year: Number(year), winRate: matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0, gpm: matchesPlayed > 0 ? goals / matchesPlayed : 0, apm: matchesPlayed > 0 ? assists / matchesPlayed : 0, contributions: goals + assists, cpm: matchesPlayed > 0 ? (goals + assists) / matchesPlayed : 0, efectividad };
    });
  }, [matches]);

  const tournamentData = useMemo(() => {
    const statsByTournament: Record<string, Omit<TournamentStats, 'name' | 'winRate' | 'gpm' | 'apm' | 'contributions' | 'cpm' | 'efectividad'>> = {};
    matches.forEach(match => {
        // Updated Logic: If a match has a tournament name, it counts. No more filtering by matchMode.
        if (match.tournament && match.tournament.trim() !== '') {
            const tournamentName = match.tournament;
            if (!statsByTournament[tournamentName]) { statsByTournament[tournamentName] = { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, points: 0, goals: 0, assists: 0 }; }
            const tourStats = statsByTournament[tournamentName];
            tourStats.matchesPlayed++;
            if (match.result === 'VICTORIA') { tourStats.wins++; tourStats.points += 3; } else if (match.result === 'EMPATE') { tourStats.draws++; tourStats.points += 1; } else { tourStats.losses++; }
            tourStats.goals += match.myGoals; tourStats.assists += match.myAssists;
        }
    });
    return Object.entries(statsByTournament).map(([name, stats]) => {
        const { matchesPlayed, wins, goals, assists, points } = stats;
        const efectividad = matchesPlayed > 0 ? (points / (matchesPlayed * 3)) * 100 : 0;
        return { ...stats, name, winRate: matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0, gpm: matchesPlayed > 0 ? goals / matchesPlayed : 0, apm: matchesPlayed > 0 ? assists / matchesPlayed : 0, contributions: goals + assists, cpm: matchesPlayed > 0 ? (goals + assists) / matchesPlayed : 0, efectividad };
    });
  }, [matches]);
  
  const maxValues = useMemo(() => {
    if (yearlyData.length === 0) return {};
    const maxes: Partial<Record<keyof YearlyStats, number>> = {};
    const keysToCompare: (keyof YearlyStats)[] = ['matchesPlayed', 'wins', 'draws', 'losses', 'points', 'winRate', 'efectividad', 'goals', 'assists', 'gpm', 'apm', 'contributions', 'cpm'];
    keysToCompare.forEach(key => { maxes[key] = Math.max(...yearlyData.map(d => d[key])); });
    return maxes;
  }, [yearlyData]);

  const tournamentMaxValues = useMemo(() => {
    if (tournamentData.length === 0) return {};
    const maxes: Partial<Record<keyof TournamentStats, number>> = {};
    const keysToCompare: (keyof TournamentStats)[] = ['matchesPlayed', 'wins', 'draws', 'losses', 'points', 'winRate', 'efectividad', 'goals', 'assists', 'gpm', 'apm', 'contributions', 'cpm'];
    keysToCompare.forEach(key => { maxes[key] = Math.max(...tournamentData.map(d => d[key] as number)); });
    return maxes;
  }, [tournamentData]);
  
  useEffect(() => { if (yearlyData.length > 0) { setVisibleYears(new Set(yearlyData.map(d => d.year))); } }, [yearlyData]);

  const sortedYearlyData = useMemo(() => { return [...yearlyData].sort((a, b) => { const aVal = a[sortConfig.key]; const bVal = b[sortConfig.key]; if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1; if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1; return 0; }); }, [yearlyData, sortConfig]);

  const sortedTournamentData = useMemo(() => { return [...tournamentData].sort((a, b) => { const key = tournamentSortConfig.key; const direction = tournamentSortConfig.direction; if (key === 'name') { return direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name); } const aVal = a[key]; const bVal = b[key]; if (aVal < bVal) return direction === 'asc' ? -1 : 1; if (aVal > bVal) return direction === 'asc' ? 1 : -1; return 0; }); }, [tournamentData, tournamentSortConfig]);

  useEffect(() => {
    const checkScrollable = (ref: React.RefObject<HTMLDivElement>, setScrollable: React.Dispatch<React.SetStateAction<boolean>>) => { const el = ref.current; if (el) { setScrollable(el.scrollWidth > el.clientWidth + 1); } };
    const handleResize = () => { checkScrollable(yearlyTableRef, setIsYearlyTableScrollable); checkScrollable(tournamentTableRef, setIsTournamentTableScrollable); };
    const timer = setTimeout(() => handleResize(), 100);
    window.addEventListener('resize', handleResize);
    return () => { clearTimeout(timer); window.removeEventListener('resize', handleResize); };
  }, [sortedYearlyData, sortedTournamentData]);

  const requestSort = (key: keyof YearlyStats) => { let direction: 'asc' | 'desc' = 'desc'; if (sortConfig.key === key && sortConfig.direction === 'desc') { direction = 'asc'; } setSortConfig({ key, direction }); };
  const requestTournamentSort = (key: keyof TournamentStats) => { let direction: 'asc' | 'desc' = 'desc'; if (tournamentSortConfig.key === key && tournamentSortConfig.direction === 'desc') { direction = 'asc'; } setTournamentSortConfig({ key, direction }); };
  const getSortIndicator = (key: keyof YearlyStats) => { if (sortConfig.key !== key) return null; return sortConfig.direction === 'desc' ? ' ↓' : ' ↑'; };
  const getTournamentSortIndicator = (key: keyof TournamentStats) => { if (tournamentSortConfig.key !== key) return null; return tournamentSortConfig.direction === 'desc' ? ' ↓' : ' ↑'; };
  
  const historicalMaxValuesForRadar = useMemo(() => {
    if (yearlyData.length === 0) return radarMetrics.map(() => 1);
    const maxMatchesPlayed = Math.max(...yearlyData.map(y => y.matchesPlayed), 1);
    return radarMetrics.map(metric => { if (['matchesPlayed', 'wins', 'draws', 'losses'].includes(metric.key)) { return maxMatchesPlayed; } if (metric.key === 'winRate' || metric.key === 'efectividad') { return 100; } return Math.max(...yearlyData.map(y => y[metric.key] as number), 1); });
  }, [yearlyData]);
  
  const radarChartData = useMemo(() => {
    if (yearlyData.length === 0) return [];
    const colors = [theme.colors.accent1, theme.colors.accent2, theme.colors.accent3, theme.colors.win, theme.colors.draw, '#FF7043', '#7E57C2', '#26A69A'];
    const sortedVisibleData = [...yearlyData].sort((a,b) => b.year - a.year);
    const currentYear = new Date().getFullYear();
    return sortedVisibleData.filter(yearStat => visibleYears.has(yearStat.year)).map((yearStat, index) => ({ name: yearStat.year.toString(), color: colors[index % colors.length], isDashed: yearStat.year === currentYear, data: radarMetrics.map(metric => ({ label: metric.label, value: yearStat[metric.key] as number })), }));
  }, [yearlyData, visibleYears, theme.colors]);
  
  const toggleYearVisibility = (year: number) => { setVisibleYears(prev => { const newSet = new Set(prev); if (newSet.has(year)) newSet.delete(year); else newSet.add(year); return newSet; }); };

  const yearlyHeaders: { key: keyof YearlyStats; label: string; isNumeric: boolean }[] = [{ key: 'year', label: 'Año', isNumeric: true }, { key: 'points', label: 'Pts', isNumeric: true }, { key: 'matchesPlayed', label: 'PJ', isNumeric: true }, { key: 'wins', label: 'V', isNumeric: true }, { key: 'draws', label: 'E', isNumeric: true }, { key: 'losses', label: 'D', isNumeric: true }, { key: 'winRate', label: '% V', isNumeric: true }, { key: 'efectividad', label: 'Efect.', isNumeric: true }, { key: 'goals', label: 'G', isNumeric: true }, { key: 'assists', label: 'A', isNumeric: true }, { key: 'gpm', label: 'G/P', isNumeric: true }, { key: 'apm', label: 'A/P', isNumeric: true }, { key: 'contributions', label: 'G+A', isNumeric: true }, { key: 'cpm', label: 'G+A/P', isNumeric: true },];
  const tournamentHeaders: { key: keyof TournamentStats; label: string; isNumeric: boolean }[] = [{ key: 'name', label: 'Torneo', isNumeric: false }, { key: 'points', label: 'Pts', isNumeric: true }, { key: 'matchesPlayed', label: 'PJ', isNumeric: true }, { key: 'wins', label: 'V', isNumeric: true }, { key: 'draws', label: 'E', isNumeric: true }, { key: 'losses', label: 'D', isNumeric: true }, { key: 'winRate', label: '% V', isNumeric: true }, { key: 'efectividad', label: 'Efect.', isNumeric: true }, { key: 'goals', label: 'G', isNumeric: true }, { key: 'assists', label: 'A', isNumeric: true }, { key: 'gpm', label: 'G/P', isNumeric: true }, { key: 'apm', label: 'A/P', isNumeric: true },];
  
  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    header: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium },
    headerButtons: { display: 'flex', alignItems: 'center', gap: theme.spacing.small },
    infoButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium, display: 'flex', alignItems: 'center' },
    
    contentWrapper: { 
        display: 'flex',
        flexDirection: 'column', 
        gap: theme.spacing.extraLarge, 
        alignItems: 'stretch',
        width: '100%'
    },
    rightColumn: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: theme.spacing.large, 
        minWidth: 0, 
        width: '100%' 
    },
    chartColumn: { 
        width: '100%' 
    },
    
    scrollWrapper: { position: 'relative' },
    tableWrapper: { minWidth: 0, overflowX: 'auto', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows.medium },
    table: { borderCollapse: 'collapse', width: '100%' },
    th: { padding: `${theme.spacing.small} ${theme.spacing.medium}`, textAlign: 'left', fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontWeight: 600, borderBottom: `2px solid ${theme.colors.borderStrong}`, cursor: 'pointer', whiteSpace: 'nowrap' },
    tr: { transition: 'background-color 0.2s' },
    td: { padding: `${theme.spacing.medium}`, fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, borderBottom: `1px solid ${theme.colors.border}`, whiteSpace: 'nowrap' },
    stickyColumn: { position: 'sticky', left: 0, backgroundColor: theme.colors.surface, borderRight: `1px solid ${theme.colors.borderStrong}` },
    numeric: { textAlign: 'right' },
    noDataContainer: { textAlign: 'center', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, color: theme.colors.secondaryText, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}` },
    chartAndLegendContainer: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large, alignItems: 'center' },
    legendContainer: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: theme.spacing.small },
    legendButton: { background: 'none', border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.medium, padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: theme.spacing.small, fontSize: theme.typography.fontSize.small, transition: 'all 0.2s ease' },
    legendColorBox: { width: '12px', height: '12px', borderRadius: '3px' },
    fadeOverlay: { position: 'absolute', top: 0, right: 0, height: '100%', width: '60px', background: `linear-gradient(to left, ${theme.colors.surface}, transparent)`, pointerEvents: 'none', borderRadius: theme.borderRadius.large },
  };

  if (matches.length === 0) { return ( <main style={styles.container}> <h2 style={styles.pageTitle}>Mi rendimiento anual</h2> <div style={styles.noDataContainer}> <TableIcon size={40} color={theme.colors.secondaryText} /> <p style={{ marginTop: theme.spacing.medium }}>Juega y registra partidos para ver tu evolución en la tabla.</p> </div> </main> ) }

  return (
    <>
    <style>{`
      .custom-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .custom-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
    <TutorialModal isOpen={isTutorialOpen} onClose={(dontShowAgain) => { setIsTutorialOpen(false); if(dontShowAgain) markTutorialAsSeen(); }} steps={tutorialSteps} />
    <ShareViewModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} page="table" />
    <main style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.medium }}>
          <h2 style={styles.pageTitle}>
            Mi rendimiento anual
            <SectionHelp steps={tableGuide} />
          </h2>
          {!isShareMode && (
              <div style={styles.headerButtons}>
                <button onClick={() => setIsShareModalOpen(true)} style={styles.infoButton} aria-label="Compartir vista"><ShareIcon color={theme.colors.secondaryText} size={20} /></button>
                <button onClick={() => setIsTutorialOpen(true)} style={styles.infoButton} aria-label="Mostrar guía"><InfoIcon color={theme.colors.secondaryText} size={20}/></button>
              </div>
          )}
        </div>
      </div>
      <div style={styles.contentWrapper}>
        <div style={styles.chartColumn}>
            {yearlyData.length > 0 && ( <Card> <div style={styles.chartAndLegendContainer}> <RadarChart playersData={radarChartData} size={isDesktop ? 350 : 300} showLegend={false} maxValues={historicalMaxValuesForRadar} /> <div style={styles.legendContainer}> {yearlyData.sort((a,b) => b.year - a.year).map((yearStat) => { const isVisible = visibleYears.has(yearStat.year); const color = radarChartData.find(d => d.name === yearStat.year.toString())?.color || theme.colors.secondaryText; return ( <button key={yearStat.year} onClick={() => toggleYearVisibility(yearStat.year)} style={{...styles.legendButton, color: isVisible ? theme.colors.primaryText : theme.colors.secondaryText, opacity: isVisible ? 1 : 0.6 }}> <span style={{...styles.legendColorBox, backgroundColor: color }}></span> {yearStat.year} </button> ); })} </div> </div> </Card> )}
        </div>
        <div style={styles.rightColumn}>
            <div style={styles.scrollWrapper}>
              <div ref={yearlyTableRef} style={styles.tableWrapper} className="custom-scrollbar">
                  <table style={styles.table}> <thead> <tr> {yearlyHeaders.map((header, index) => ( <th key={header.key} style={{...styles.th, ...(header.isNumeric && styles.numeric), ...(index === 0 && styles.stickyColumn) }} className={index === 0 ? 'sticky-column' : ''} onClick={() => requestSort(header.key)}> {header.label} {getSortIndicator(header.key)} </th> ))} </tr> </thead> <tbody> {sortedYearlyData.map(stats => { const isMax = (key: keyof YearlyStats) => maxValues[key] !== undefined && stats[key] === maxValues[key] && (maxValues[key] as number) > 0; const maxStyle: React.CSSProperties = { fontWeight: 700, color: theme.colors.win }; return ( <tr key={stats.year} style={styles.tr} className="table-row"> <td style={{...styles.td, ...styles.numeric, fontWeight: 700, ...styles.stickyColumn}} className="sticky-column">{stats.year}</td>
                                    {yearlyHeaders.slice(1).map(header => (
                                        <td key={header.key} style={{...styles.td, ...(header.isNumeric && styles.numeric), ...(isMax(header.key) ? maxStyle : {})}}>
                                            {header.key === 'winRate' || header.key === 'efectividad' ? `${stats[header.key].toFixed(1)}%` : 
                                             header.key === 'gpm' || header.key === 'apm' || header.key === 'cpm' ? stats[header.key].toFixed(2) :
                                             stats[header.key]}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {isYearlyTableScrollable && <div style={styles.fadeOverlay} />}
        </div>

        {tournamentData.length > 0 && (
            <div style={{ marginTop: theme.spacing.extraLarge }}>
                <h3 style={{...styles.pageTitle, fontSize: '1.2rem'}}>Por Torneo <SectionHelp steps={tournamentGuide} /></h3>
                <div style={styles.scrollWrapper}>
                    <div ref={tournamentTableRef} style={styles.tableWrapper} className="custom-scrollbar">
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    {tournamentHeaders.map((header) => (
                                        <th key={header.key} style={{...styles.th, ...(header.isNumeric && styles.numeric)}} onClick={() => requestTournamentSort(header.key)}>
                                            {header.label} {getTournamentSortIndicator(header.key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTournamentData.map(stats => {
                                    const isMax = (key: keyof TournamentStats) => tournamentMaxValues[key] !== undefined && stats[key] === tournamentMaxValues[key] && (tournamentMaxValues[key] as number) > 0;
                                    const maxStyle: React.CSSProperties = { fontWeight: 700, color: theme.colors.win };
                                    return (
                                        <tr key={stats.name} style={styles.tr} className="table-row">
                                            <td style={styles.td}>{stats.name}</td>
                                            {tournamentHeaders.slice(1).map(header => (
                                                <td key={header.key} style={{...styles.td, ...(header.isNumeric && styles.numeric), ...(isMax(header.key) ? maxStyle : {})}}>
                                                    {header.key === 'winRate' || header.key === 'efectividad' ? `${(stats[header.key] as number).toFixed(1)}%` : 
                                                     header.key === 'gpm' || header.key === 'apm' || header.key === 'cpm' ? (stats[header.key] as number).toFixed(2) :
                                                     stats[header.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {isTournamentTableScrollable && <div style={styles.fadeOverlay} />}
                </div>
            </div>
        )}
      </div>
      </div>
    </main>
    </>
  );
};

export default TablePage;

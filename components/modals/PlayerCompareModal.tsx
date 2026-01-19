
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import type { Match, PlayerContextStats } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import YearFilter from '../YearFilter';
import { parseLocalDate } from '../../utils/analytics';
import AutocompleteInput from '../AutocompleteInput';
import RadarChart from '../charts/RadarChart';

interface PlayerCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlayers: string[];
  allMatches: Match[];
}

const calculateContextStats = (contextMatches: Match[]): PlayerContextStats | null => {
    if (contextMatches.length === 0) return null;
    const matchesPlayed = contextMatches.length;
    const wins = contextMatches.filter(m => m.result === 'VICTORIA').length;
    const draws = contextMatches.filter(m => m.result === 'EMPATE').length;
    const losses = matchesPlayed - wins - draws;
    const myGoals = contextMatches.reduce((sum, m) => sum + m.myGoals, 0);
    const myAssists = contextMatches.reduce((sum, m) => sum + m.myAssists, 0);
    const points = (wins * 3) + draws;
    return {
      matchesPlayed,
      winRate: matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0,
      record: { wins, draws, losses },
      myGoals, myAssists,
      gpm: matchesPlayed > 0 ? myGoals / matchesPlayed : 0,
      apm: matchesPlayed > 0 ? myAssists / matchesPlayed : 0,
      points,
      matches: [...contextMatches].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()),
    };
};

const getNestedValue = (obj: any, path: string) => {
    if (!obj) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const radarMetrics: { label: string; key: string }[] = [
    { label: 'G/P', key: 'playerGpm' },
    { label: 'A/P', key: 'playerApm' },
    { label: '% V', key: 'winRate' },
    { label: 'PJ', key: 'matchesPlayed' },
    { label: 'Goles', key: 'playerGoals' },
    { label: 'Asist.', key: 'playerAssists' },
];


const PlayerCompareModal: React.FC<PlayerCompareModalProps> = ({ isOpen, onClose, allPlayers, allMatches }) => {
  const { theme } = useTheme();
  const { playerProfile } = useData();
  
  const [playerSlots, setPlayerSlots] = useState<string[]>(['', '', '']);
  const selectedPlayers = useMemo(() => playerSlots.filter(p => p.trim()), [playerSlots]);

  const [context, setContext] = useState<'teammates' | 'opponents'>('teammates');
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setPlayerSlots(['', '', '']);
      setContext('teammates');
      setSelectedYear('all');
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);
  
  const handlePlayerSlotChange = (index: number, value: string) => {
      setPlayerSlots(prev => {
          const newSlots = [...prev];
          newSlots[index] = value;
          return newSlots;
      });
  };

  const availableYears = useMemo(() => {
    const playerMatches = allMatches.filter(m =>
      selectedPlayers.some(p =>
        p && (m.myTeamPlayers?.some(pl => pl.name === p) || m.opponentPlayers?.some(pl => pl.name === p))
      )
    );
    const yearSet = new Set<number>(playerMatches.map(m => parseLocalDate(m.date).getFullYear()));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [selectedPlayers, allMatches]);

  const filteredMatches = useMemo(() =>
    selectedYear === 'all'
      ? allMatches
      : allMatches.filter(m => parseLocalDate(m.date).getFullYear().toString() === selectedYear),
  [allMatches, selectedYear]);

  const playersStats = useMemo(() => {
    const getPlayerStats = (playerName: string) => {
      const contextMatches = filteredMatches.filter(m =>
        context === 'teammates'
          ? m.myTeamPlayers?.some(p => p.name === playerName)
          : m.opponentPlayers?.some(p => p.name === playerName)
      );

      const baseStats = calculateContextStats(contextMatches);
      if (!baseStats) return null;

      let playerGoals = 0;
      let playerAssists = 0;
      const playerArrayKey = context === 'teammates' ? 'myTeamPlayers' : 'opponentPlayers';
      contextMatches.forEach(match => {
          const playerPerf = match[playerArrayKey]?.find(p => p.name === playerName);
          if (playerPerf) {
              playerGoals += playerPerf.goals;
              playerAssists += playerPerf.assists;
          }
      });
      
      const gpm = baseStats.matchesPlayed > 0 ? playerGoals / baseStats.matchesPlayed : 0;
      const apm = baseStats.matchesPlayed > 0 ? playerAssists / baseStats.matchesPlayed : 0;

      return {
          ...baseStats,
          playerGoals,
          playerAssists,
          playerGpm: gpm,
          playerApm: apm,
      };
    };

    const statsMap = new Map<string, ReturnType<typeof getPlayerStats>>();
    selectedPlayers.forEach(player => {
      statsMap.set(player, getPlayerStats(player));
    });
    return statsMap;
  }, [selectedPlayers, filteredMatches, context]);
  
  const radarChartData = useMemo(() => {
    if (selectedPlayers.length === 0) return [];
    
    const colors = [
        theme.colors.accent1, theme.colors.accent2, theme.colors.accent3, theme.colors.win
    ];

    return selectedPlayers.map((playerName, index) => {
      const stats = playersStats.get(playerName);
      return {
        name: playerName,
        color: colors[index % colors.length],
        data: radarMetrics.map(metric => ({
          label: metric.label,
          value: stats ? getNestedValue(stats, metric.key) || 0 : 0
        })),
      };
    });
  }, [selectedPlayers, playersStats, theme.colors]);
  
  const maxValuesForRadar = useMemo(() => {
    if (radarChartData.length === 0) {
      return radarMetrics.map(() => 1);
    }
    return radarMetrics.map((metric, i) => {
      if (metric.key === 'winRate') {
          return 100;
      }
      return Math.max(...radarChartData.map(player => player.data[i].value), 1);
    });
  }, [radarChartData]);
  
  const tableStats: { key: string; label: string; format: (v: any) => string; highlight?: boolean }[] = [
    { key: 'matchesPlayed', label: 'PJ', format: v => v?.toString() ?? '-', highlight: true },
    { key: 'playerGoals', label: 'Goles', format: v => v?.toString() ?? '-', highlight: true },
    { key: 'playerAssists', label: 'Asistencias', format: v => v?.toString() ?? '-', highlight: true },
    { key: 'playerGpm', label: 'G/P', format: v => v !== undefined ? v.toFixed(2) : '-', highlight: true },
    { key: 'playerApm', label: 'A/P', format: v => v !== undefined ? v.toFixed(2) : '-', highlight: true },
    { key: 'winRate', label: '% Victorias', format: v => v !== undefined ? `${v.toFixed(1)}%` : '-', highlight: true },
    { key: 'record.wins', label: 'G', format: v => v?.toString() ?? '-', highlight: true },
    { key: 'record.draws', label: 'E', format: v => v?.toString() ?? '-', highlight: false },
    { key: 'record.losses', label: 'P', format: v => v?.toString() ?? '-', highlight: false },
  ];
  
  if (!isOpen) {
    return null;
  }

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '600px',
      maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
      animation: 'scaleUp 0.3s ease', border: `1px solid ${theme.colors.border}`,
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderBottom: `1px solid ${theme.colors.border}`, flexShrink: 0,
      position: 'sticky', top: 0, backgroundColor: theme.colors.surface, zIndex: 1,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    content: {
      display: 'flex', flexDirection: 'column',
      padding: theme.spacing.large, gap: theme.spacing.large,
    },
    playerSlots: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: theme.spacing.medium
    },
    filterControls: {
        display: 'flex', gap: theme.spacing.medium, alignItems: 'center',
        flexWrap: 'wrap'
    },
    contextSelector: {
        display: 'flex', borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.borderStrong}`, overflow: 'hidden'
    },
    contextButton: { 
        flex: 1, background: 'transparent', border: 'none', color: theme.colors.secondaryText, 
        padding: '0.6rem 1rem', borderRadius: 0, cursor: 'pointer', fontWeight: 600,
        transition: 'background-color 0.2s, color 0.2s', whiteSpace: 'nowrap'
    },
    activeContext: {
        backgroundColor: theme.name === 'dark' ? theme.colors.accent2 : theme.colors.borderStrong, 
        color: theme.name === 'dark' ? theme.colors.background : theme.colors.primaryText,
    },
    placeholder: {
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: theme.colors.secondaryText, fontStyle: 'italic', padding: '2rem 0',
      textAlign: 'center'
    },
    tableContainer: {
        width: '100%',
        overflowX: 'auto'
    },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: theme.spacing.large },
    tableHeaderCell: {
        textAlign: 'center', color: theme.colors.primaryText,
        fontWeight: 700, padding: '0.5rem',
        borderBottom: `1px solid ${theme.colors.borderStrong}`,
        whiteSpace: 'nowrap',
    },
    tableLabelCell: {
      textAlign: 'left', color: theme.colors.secondaryText,
      fontSize: '0.675rem', fontWeight: 500, padding: '0.75rem 0',
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    tableValueCell: {
      textAlign: 'center', fontSize: '0.675rem', fontWeight: 500,
      padding: '0.75rem 0.5rem', borderBottom: `1px solid ${theme.colors.border}`,
    },
  };

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }
        .subtle-scrollbar::-webkit-scrollbar { display: none; }
        .subtle-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()} className="subtle-scrollbar">
          <header style={styles.header}>
            <h2 style={styles.title}>Comparador de Jugadores</h2>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          <div style={styles.content}>
            <div style={styles.playerSlots}>
                {playerSlots.map((player, index) => (
                    <AutocompleteInput 
                        key={index}
                        value={player}
                        onChange={(value) => handlePlayerSlotChange(index, value)}
                        suggestions={allPlayers.filter(p => !playerSlots.includes(p) || p === player)}
                        placeholder={`Jugador ${index + 1}`}
                    />
                ))}
            </div>

            <div style={styles.filterControls}>
                <div style={{flex: 1, minWidth: '150px'}}>
                    <YearFilter years={availableYears} selectedYear={selectedYear} onSelectYear={setSelectedYear} size="small"/>
                </div>
                <div style={styles.contextSelector}>
                    <button onClick={() => setContext('teammates')} style={context === 'teammates' ? {...styles.contextButton, ...styles.activeContext} : styles.contextButton}>Compañeros</button>
                    <button onClick={() => setContext('opponents')} style={context === 'opponents' ? {...styles.contextButton, ...styles.activeContext} : styles.contextButton}>Rivales</button>
                </div>
            </div>

            {selectedPlayers.length === 0 ? (
                <div style={styles.placeholder}>Selecciona al menos un jugador para ver sus estadísticas.</div>
            ) : (
                <>
                    <div style={styles.tableContainer} className="subtle-scrollbar">
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{...styles.tableHeaderCell, textAlign: 'left', paddingLeft: 0}}>Métrica</th>
                                    {selectedPlayers.map(p => {
                                        const isLinked = !!playerProfile.playerMappings?.[p];
                                        return (
                                            <th 
                                                key={p} 
                                                style={{
                                                    ...styles.tableHeaderCell,
                                                    textDecoration: isLinked ? 'underline' : 'none',
                                                    textDecorationColor: theme.colors.accent2
                                                }}
                                            >
                                                {p}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {tableStats.map(stat => {
                                    const values = selectedPlayers.map(p => getNestedValue(playersStats.get(p), stat.key));
                                    const numericValues = (stat.highlight ? values.filter(v => typeof v === 'number') : []) as number[];
                                    const maxValue = numericValues.length > 0 ? Math.max(...numericValues) : -Infinity;

                                    return (
                                        <tr key={stat.key}>
                                            <td style={styles.tableLabelCell}>{stat.label}</td>
                                            {selectedPlayers.map((p, index) => {
                                                const value = values[index];
                                                const isMax = stat.highlight && typeof value === 'number' && value === maxValue && maxValue > -Infinity;
                                                return (
                                                    <td key={p} style={{...styles.tableValueCell, color: theme.colors.primaryText, fontWeight: isMax ? 700 : 500}}>
                                                        {stat.format(value)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {selectedPlayers.length > 0 && (
                        <RadarChart
                            playersData={radarChartData}
                            size={280}
                            maxValues={maxValuesForRadar}
                        />
                    )}
                </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};

export default PlayerCompareModal;

import React, { useState, useMemo } from 'react';
import type { Match, Goal, GoalMetric } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/common/Card';
import { calculateHistoricalRecords } from '../utils/analytics';

interface GoalsPageProps {
  matches: Match[];
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

const metricLabels: Record<GoalMetric, string> = {
  myGoals: 'Goles',
  myAssists: 'Asistencias',
  VICTORIA: 'Victorias',
  longestWinStreak: 'Racha de Victorias',
  longestUndefeatedStreak: 'Racha Invicta',
  winRate: '% de Victorias',
  gpm: 'Goles por Partido',
  undefeatedRate: '% Invicto',
};

const metricIcons: Record<GoalMetric, React.ReactNode> = {
  myGoals: <span style={{ fontSize: '1.5rem' }}>⚽️</span>,
  myAssists: <span style={{ fontSize: '1.5rem' }}>👟</span>,
  VICTORIA: <span style={{ fontSize: '1.5rem' }}>✅</span>,
  longestWinStreak: <span style={{ fontSize: '1.5rem' }}>🔥</span>,
  longestUndefeatedStreak: <span style={{ fontSize: '1.5rem' }}>🛡️</span>,
  winRate: <span style={{ fontSize: '1.5rem' }}>📈</span>,
  gpm: <span style={{ fontSize: '1.5rem' }}>🎯</span>,
  undefeatedRate: <span style={{ fontSize: '1.5rem' }}>💪</span>,
};

const generateGoalTitle = (metric: GoalMetric, target: number): string => {
    switch (metric) {
        case 'myGoals':
        case 'myAssists':
        case 'VICTORIA':
            return `Alcanzar ${target} ${metricLabels[metric]}`;
        case 'longestWinStreak':
            return `Racha de ${target} victorias`;
        case 'longestUndefeatedStreak':
            return `Racha de ${target} partidos invicto`;
        default:
            return `Meta: ${target}`;
    }
};

const GoalsPage: React.FC<GoalsPageProps> = ({ matches, goals, setGoals }) => {
  const { theme } = useTheme();
  const [newGoalMetric, setNewGoalMetric] = useState<GoalMetric>('myGoals');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const progressData = useMemo(() => {
    const historicalRecords = calculateHistoricalRecords(matches);
    const totalMatches = matches.length;
    return {
      myGoals: matches.reduce((sum, m) => sum + m.myGoals, 0),
      myAssists: matches.reduce((sum, m) => sum + m.myAssists, 0),
      VICTORIA: matches.filter(m => m.result === 'VICTORIA').length,
      longestWinStreak: historicalRecords.longestWinStreak.value,
      longestUndefeatedStreak: historicalRecords.longestUndefeatedStreak.value,
      winRate: totalMatches > 0 ? (matches.filter(m => m.result === 'VICTORIA').length / totalMatches) * 100 : 0,
      gpm: totalMatches > 0 ? matches.reduce((sum, m) => sum + m.myGoals, 0) / totalMatches : 0,
      undefeatedRate: totalMatches > 0 ? (matches.filter(m => m.result !== 'DERROTA').length / totalMatches) * 100 : 0,
    };
  }, [matches]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(newGoalTarget, 10);
    if (!target || target <= 0) return;

    const newGoal: Goal = {
      id: Date.now().toString(),
      metric: newGoalMetric,
      goalType: 'accumulate', // Defaulting as this page is simple
      target,
      title: generateGoalTitle(newGoalMetric, target),
    };

    setGoals(prev => [...prev, newGoal]);
    setNewGoalTarget('');
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.extraLarge },
    pageTitle: {
      fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText,
      margin: 0, borderLeft: `4px solid ${theme.colors.accent2}`, paddingLeft: theme.spacing.medium,
    },
    formCard: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    form: { display: 'flex', gap: theme.spacing.medium, alignItems: 'flex-end', flexWrap: 'wrap' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small, flex: 1, minWidth: '150px' },
    label: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontWeight: 500 },
    input: {
      width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText,
      fontSize: theme.typography.fontSize.medium,
    },
    button: {
      padding: `${theme.spacing.medium} ${theme.spacing.large}`, backgroundColor: theme.colors.accent1,
      color: theme.colors.textOnAccent, border: 'none', borderRadius: theme.borderRadius.medium,
      fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer',
    },
    goalsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: theme.spacing.large },
    goalCard: { display: 'flex', flexDirection: 'column', gap: theme.spacing.medium, position: 'relative' },
    goalHeader: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium },
    goalTitle: { margin: 0, fontSize: theme.typography.fontSize.large, color: theme.colors.primaryText, flex: 1 },
    progressInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
    progressText: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText },
    progressValue: { fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    progressBarContainer: { width: '100%', backgroundColor: theme.colors.border, borderRadius: theme.borderRadius.small, overflow: 'hidden', height: '8px' },
    progressBar: { height: '100%', backgroundColor: theme.colors.accent1, transition: 'width 0.5s ease-in-out', borderRadius: theme.borderRadius.small },
    deleteButton: { position: 'absolute', top: theme.spacing.small, right: theme.spacing.small, background: 'none', border: 'none', color: theme.colors.secondaryText, cursor: 'pointer' },
  };

  return (
    <main style={styles.container}>
      <h2 style={styles.pageTitle}>Tus Metas</h2>
      <Card style={styles.formCard}>
        <h3 style={{ margin: 0 }}>Añadir Nueva Meta</h3>
        <form onSubmit={handleAddGoal} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="metric" style={styles.label}>Métrica</label>
            <select id="metric" value={newGoalMetric} onChange={e => setNewGoalMetric(e.target.value as GoalMetric)} style={styles.input}>
              {Object.entries(metricLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label htmlFor="target" style={styles.label}>Objetivo Numérico</label>
            <input id="target" type="number" min="1" value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)} style={styles.input} />
          </div>
          <button type="submit" style={styles.button}>Añadir</button>
        </form>
      </Card>
      <div style={styles.goalsGrid}>
        {goals.map(goal => {
          const currentProgress = progressData[goal.metric as keyof typeof progressData];
          const progressPercentage = Math.min((currentProgress / goal.target) * 100, 100);
          return (
            <Card key={goal.id} style={styles.goalCard}>
              <button onClick={() => handleDeleteGoal(goal.id)} style={styles.deleteButton}>&times;</button>
              <div style={styles.goalHeader}>
                {metricIcons[goal.metric]}
                <h4 style={styles.goalTitle}>{goal.title}</h4>
              </div>
              <div style={styles.progressInfo}>
                <span style={styles.progressText}>Progreso</span>
                <span style={styles.progressValue}>{currentProgress} / {goal.target}</span>
              </div>
              <div style={styles.progressBarContainer}>
                <div style={{ ...styles.progressBar, width: `${progressPercentage}%` }} />
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
};

export default GoalsPage;
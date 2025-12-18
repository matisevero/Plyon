
import React, { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { ChevronIcon } from './icons/ChevronIcon';
import { achievementsList } from '../data/achievements';
import { getProgressForGoal, calculateHistoricalRecords, parseLocalDate, evaluateCustomAchievement } from '../utils/analytics';
import type { Goal, CustomAchievement, Match, Achievement, AchievementTier } from '../types';

interface Milestone {
  type: 'goal' | 'achievement';
  title: string;
  icon: React.ReactNode;
  date: string;
  id: string;
}

interface HistoryAccordionProps {
  type: 'goals' | 'achievements';
}

const HistoryAccordion: React.FC<HistoryAccordionProps> = ({ type }) => {
    const { theme } = useTheme();
    const { matches, goals, customAchievements } = useData();
    const [isExpanded, setIsExpanded] = useState(false);

    // Títulos actualizados según solicitud
    const title = useMemo(() => (type === 'goals' ? 'Historial de Objetivos cumplidos' : 'Vitrina de Trofeos'), [type]);

    const historicalMilestones = useMemo(() => {
        if (matches.length === 0) return {};

        const sortedMatches = [...matches].sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());
        const milestones: (Milestone & { year: number })[] = [];
        
        if (type === 'goals') {
            goals.forEach(goal => {
                // Check if currently completed
                const overallProgress = getProgressForGoal(goal, sortedMatches);
                if (overallProgress < goal.target) return; 

                // Find WHEN it was completed
                for (let i = 1; i <= sortedMatches.length; i++) {
                    const matchesUpToDate = sortedMatches.slice(0, i);
                    const progress = getProgressForGoal(goal, matchesUpToDate);
                    if (progress >= goal.target) {
                        const completionDate = parseLocalDate(sortedMatches[i - 1].date);
                        milestones.push({
                            id: `goal-${goal.id}`,
                            type: 'goal',
                            title: goal.title,
                            icon: '🎯',
                            date: completionDate.toLocaleDateString('es-ES'),
                            year: completionDate.getFullYear(),
                        });
                        break; 
                    }
                }
            });
        }

        if (type === 'achievements') {
            achievementsList.forEach(ach => {
                const highestUnlockedTier = [...ach.tiers].reverse().find(tier => {
                    const records = calculateHistoricalRecords(sortedMatches);
                    const progress = ach.progress(sortedMatches, records);
                    return progress >= tier.target;
                });

                if (highestUnlockedTier) {
                    for (let i = 1; i <= sortedMatches.length; i++) {
                        const matchesUpToDate = sortedMatches.slice(0, i);
                        const records = calculateHistoricalRecords(matchesUpToDate);
                        const progress = ach.progress(matchesUpToDate, records);
                        if (progress >= highestUnlockedTier.target) {
                            const completionDate = parseLocalDate(sortedMatches[i - 1].date);
                            milestones.push({
                                id: `ach-${ach.id}-${highestUnlockedTier.name}`,
                                type: 'achievement',
                                title: `${ach.title} (${highestUnlockedTier.name})`,
                                icon: highestUnlockedTier.icon,
                                date: completionDate.toLocaleDateString('es-ES'),
                                year: completionDate.getFullYear(),
                            });
                            break; 
                        }
                    }
                }
            });
            
            customAchievements.forEach(ach => {
                 if (ach.unlocked) {
                     for (let i = 1; i <= sortedMatches.length; i++) {
                        const matchesUpToDate = sortedMatches.slice(0, i);
                         if (evaluateCustomAchievement(ach, matchesUpToDate)) {
                            const completionDate = parseLocalDate(sortedMatches[i - 1].date);
                             milestones.push({
                                id: `custom-ach-${ach.id}`,
                                type: 'achievement',
                                title: ach.title,
                                icon: ach.icon,
                                date: completionDate.toLocaleDateString('es-ES'),
                                year: completionDate.getFullYear(),
                            });
                            break;
                         }
                     }
                 }
            });
        }

        const groupedByYear: Record<number, Milestone[]> = {};
        // Remove duplicates if any
        const uniqueMilestones = Array.from(new Map(milestones.map(m => [m.id, m])).values());

        uniqueMilestones.forEach(milestone => {
            if (!groupedByYear[milestone.year]) {
                groupedByYear[milestone.year] = [];
            }
            groupedByYear[milestone.year].push(milestone);
        });
        
        return groupedByYear;
    }, [matches, goals, customAchievements, type]);

    const sortedYears = Object.keys(historicalMilestones).map(Number).sort((a, b) => b - a);

    const styles: { [key: string]: React.CSSProperties } = {
        container: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}`, display: 'flex', flexDirection: 'column' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${theme.spacing.medium} ${theme.spacing.large}`, cursor: 'pointer' },
        title: { fontSize: theme.typography.fontSize.large, fontWeight: 600, color: theme.colors.primaryText, margin: 0 },
        content: { padding: `0 ${theme.spacing.large} ${theme.spacing.large}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
        yearSection: {},
        yearTitle: { fontSize: theme.typography.fontSize.medium, fontWeight: 700, color: theme.colors.primaryText, margin: `0 0 ${theme.spacing.medium} 0`, paddingBottom: theme.spacing.small, borderBottom: `2px solid ${theme.colors.border}` },
        milestoneItem: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium, padding: `${theme.spacing.small} 0`, borderBottom: `1px solid ${theme.colors.border}` },
        milestoneIcon: { fontSize: '1.2rem' },
        milestoneInfo: { flex: 1 },
        milestoneTitle: { color: theme.colors.primaryText, fontWeight: 500, margin: 0 },
        milestoneDate: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, margin: 0 },
        emptyState: { fontStyle: 'italic', color: theme.colors.secondaryText, textAlign: 'center' }
    };

    return (
        <>
            <style>{`@keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <div style={styles.container}>
                <div style={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
                    <h3 style={styles.title}>{title}</h3>
                    <ChevronIcon isExpanded={isExpanded} />
                </div>
                {isExpanded && (
                    <div style={{ ...styles.content, animation: 'fadeInDown 0.3s ease-out' }}>
                        {sortedYears.length === 0 ? (
                            <p style={styles.emptyState}>No hay hitos completados aún.</p>
                        ) : (
                            sortedYears.map(year => (
                                <div key={year} style={styles.yearSection}>
                                    <h4 style={styles.yearTitle}>{year}</h4>
                                    {historicalMilestones[year].map((milestone, index) => (
                                        <div key={milestone.id} style={{ ...styles.milestoneItem, ...(index === historicalMilestones[year].length - 1 && { borderBottom: 'none' }) }}>
                                            <span style={styles.milestoneIcon}>{milestone.icon}</span>
                                            <div style={styles.milestoneInfo}>
                                                <p style={styles.milestoneTitle}>{milestone.title}</p>
                                                <p style={styles.milestoneDate}>{milestone.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default HistoryAccordion;

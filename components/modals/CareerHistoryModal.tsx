
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { CloseIcon } from '../icons/CloseIcon';
import { TrophyIcon } from '../icons/TrophyIcon';
import { GlobeIcon } from '../icons/GlobeIcon';
import { parseLocalDate, CONFEDERATIONS } from '../../utils/analytics';
import type { WorldCupCampaignHistory, QualifiersCampaignHistory, WorldCupStage } from '../../types';

interface CareerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldCupHistory?: WorldCupCampaignHistory[];
  qualifiersHistory?: QualifiersCampaignHistory[];
}

const CareerHistoryModal: React.FC<CareerHistoryModalProps> = ({ isOpen, onClose, worldCupHistory = [], qualifiersHistory = [] }) => {
  const { theme } = useTheme();

  const unifiedHistory = useMemo(() => {
    const wcItems = worldCupHistory.map(h => ({ ...h, type: 'worldcup' as const }));
    const qItems = qualifiersHistory.map(h => ({ ...h, type: 'qualifiers' as const }));
    
    // Merge and sort by End Date descending (newest first)
    return [...wcItems, ...qItems].sort((a, b) => 
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    );
  }, [worldCupHistory, qualifiersHistory]);

  if (!isOpen) return null;

  const stageLabels: Record<WorldCupStage | 'eliminated_group' | 'abandoned', string> = {
      'abandoned': 'Abandonada',
      'eliminated_group': 'Fase de Grupos',
      'group': 'Fase de Grupos',
      'round_of_16': 'Octavos',
      'quarter_finals': 'Cuartos',
      'semi_finals': 'Semifinal',
      'final': 'Final'
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 2500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '600px',
      maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      animation: 'scaleUp 0.3s ease', border: `1px solid ${theme.colors.border}`,
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    content: {
      padding: theme.spacing.large, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: theme.spacing.medium,
    },
    emptyState: { textAlign: 'center', color: theme.colors.secondaryText, fontStyle: 'italic', padding: '2rem' },
    itemCard: {
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        padding: theme.spacing.medium,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.borderStrong}`,
        position: 'relative',
        overflow: 'hidden',
    },
    itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    itemType: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' },
    itemDate: { fontSize: '0.75rem', color: theme.colors.secondaryText },
    itemBody: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' },
    itemResult: { fontSize: '0.9rem', fontWeight: 600 },
    itemRecord: { fontSize: '0.8rem', color: theme.colors.secondaryText },
    wcAccent: { borderLeft: `4px solid ${theme.colors.accent1}` },
    qAccent: { borderLeft: `4px solid ${theme.colors.accent2}` },
    statusBadge: {
        padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
    }
  };

  const modalJSX = (
    <>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }
        `}</style>
        <div style={styles.backdrop} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <header style={styles.header}>
                    <h2 style={styles.title}>Historial de Carrera</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><CloseIcon color={theme.colors.primaryText} /></button>
                </header>
                <div style={styles.content}>
                    {unifiedHistory.length === 0 ? (
                        <div style={styles.emptyState}>
                            Aún no has completado ninguna campaña de Mundial o Eliminatorias.
                        </div>
                    ) : (
                        unifiedHistory.map((item, index) => {
                            if (item.type === 'worldcup') {
                                const wcItem = item as any; // Cast for TS within block
                                const wins = wcItem.results.filter((r: string) => r === 'VICTORIA').length;
                                const draws = wcItem.results.filter((r: string) => r === 'EMPATE').length;
                                const losses = wcItem.results.filter((r: string) => r === 'DERROTA').length;
                                
                                let resultText = stageLabels[wcItem.finalStage as WorldCupStage] || 'Desconocido';
                                let resultColor = theme.colors.secondaryText;
                                
                                if (wcItem.status === 'champion') {
                                    resultText = '🏆 CAMPEÓN';
                                    resultColor = theme.colors.win;
                                } else if (wcItem.status === 'abandoned') {
                                    resultText = 'Abandonado';
                                }

                                return (
                                    <div key={`wc-${index}`} style={{...styles.itemCard, ...styles.wcAccent}}>
                                        <div style={styles.itemHeader}>
                                            <div style={{...styles.itemType, color: theme.colors.accent1}}>
                                                <TrophyIcon size={16} /> Mundial #{wcItem.campaignNumber}
                                            </div>
                                            <span style={styles.itemDate}>{parseLocalDate(wcItem.endDate).toLocaleDateString()}</span>
                                        </div>
                                        <div style={styles.itemBody}>
                                            <span style={{...styles.itemResult, color: resultColor}}>{resultText}</span>
                                            <span style={styles.itemRecord}>{wins}V - {draws}E - {losses}D</span>
                                        </div>
                                    </div>
                                );
                            } else {
                                const qItem = item as any;
                                const conf = CONFEDERATIONS[qItem.confederation as keyof typeof CONFEDERATIONS];
                                let resultText = `${qItem.finalPosition}° Puesto`;
                                let resultColor = theme.colors.secondaryText;

                                if (qItem.status === 'completed') {
                                    if (qItem.finalPosition <= conf.slots) {
                                        resultText = '✅ Clasificado';
                                        resultColor = theme.colors.win;
                                    } else if (qItem.finalPosition <= conf.slots + conf.playoffSlots) {
                                        resultText = '🟠 Repechaje';
                                        resultColor = theme.colors.accent3;
                                    } else {
                                        resultText = '❌ Eliminado';
                                        resultColor = theme.colors.loss;
                                    }
                                } else {
                                    resultText = 'Abandonado';
                                }

                                return (
                                    <div key={`q-${index}`} style={{...styles.itemCard, ...styles.qAccent}}>
                                        <div style={styles.itemHeader}>
                                            <div style={{...styles.itemType, color: theme.colors.accent2}}>
                                                <GlobeIcon size={16} /> {conf.name} #{qItem.campaignNumber}
                                            </div>
                                            <span style={styles.itemDate}>{parseLocalDate(qItem.endDate).toLocaleDateString()}</span>
                                        </div>
                                        <div style={styles.itemBody}>
                                            <span style={{...styles.itemResult, color: resultColor}}>{resultText}</span>
                                            <span style={styles.itemRecord}>{qItem.record.wins}V - {qItem.record.draws}E - {qItem.record.losses}D</span>
                                        </div>
                                    </div>
                                );
                            }
                        })
                    )}
                </div>
            </div>
        </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};

export default CareerHistoryModal;

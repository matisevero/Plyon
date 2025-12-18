
import React, { useMemo, useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import GroupStageProgress from './worldcup/GroupStageProgress';
import StageItem from './worldcup/StageItem';
import ChampionCelebration from './worldcup/ChampionCelebration';
import QualifiersView from './worldcup/QualifiersView';
import type { WorldCupStage, WorldCupCampaignHistory, QualifiersProgress, ConfederationName, QualifiersCampaignHistory as QualifiersHistoryType } from '../types';
import { StarIcon } from '../components/icons/StarIcon';
import { ChevronIcon } from '../components/icons/ChevronIcon';
import MatchFormIndicator from '../components/MatchFormIndicator';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import ConfederationSelectModal from '../components/modals/ConfederationSelectModal';
import { GlobeIcon } from '../components/icons/GlobeIcon';
import { CONFEDERATIONS, WORLD_CUP_LOGO } from '../utils/analytics';
import { useTutorial } from '../hooks/useTutorial';
import TutorialModal from '../components/modals/TutorialModal';
import { PlayerIcon } from '../components/icons/PlayerIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';

// --- Sub-component for an active campaign ---
const CampaignView: React.FC<{ onBackToSelection: () => void }> = ({ onBackToSelection }) => {
    const { theme } = useTheme();
    const { playerProfile, clearChampionCampaign } = useData();
    const { worldCupProgress, worldCupHistory } = playerProfile;
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 992);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!worldCupProgress) return null;

    if (worldCupProgress.championOfCampaign) {
        return <ChampionCelebration onNextCampaign={clearChampionCampaign} />;
    }

    const stageOrder: (WorldCupStage | 'eliminated_group' | 'abandoned')[] = ['abandoned', 'eliminated_group', 'group', 'round_of_16', 'quarter_finals', 'semi_finals', 'final'];
    const stageLabels: Record<WorldCupStage | 'eliminated_group' | 'abandoned', string> = {
        'abandoned': 'Campaña Abandonada',
        'eliminated_group': 'Fase de Grupos (Eliminado)', 'group': 'Fase de Grupos (Clasificado)',
        'round_of_16': 'Octavos de Final', 'quarter_finals': 'Cuartos de Final',
        'semi_finals': 'Semifinal', 'final': 'Final'
    };


    const bestStageReached = useMemo(() => {
        if (!worldCupHistory || worldCupHistory.length === 0) return null;
        const bestStageIndex = Math.max(...worldCupHistory.map(h => stageOrder.indexOf(h.finalStage)));
        return stageOrder[bestStageIndex];
    }, [worldCupHistory]);

    const styles: { [key: string]: React.CSSProperties } = {
        headerContainer: {
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            justifyContent: 'space-between',
            alignItems: isDesktop ? 'center' : 'flex-start',
            gap: theme.spacing.medium,
            marginBottom: theme.spacing.large,
        },
        pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: `0`, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium },
        backButton: {
            background: 'transparent',
            border: `1px solid ${theme.colors.borderStrong}`,
            color: theme.colors.secondaryText,
            padding: `${theme.spacing.small} ${theme.spacing.medium}`,
            borderRadius: theme.borderRadius.medium,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: theme.typography.fontSize.small,
            transition: 'background-color 0.2s, color 0.2s',
        },
        contentWrapper: { display: 'grid', gridTemplateColumns: '1fr', gap: theme.spacing.extraLarge, alignItems: 'start', ...(isDesktop && { gridTemplateColumns: '1fr 1fr' })},
        bracketContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.small },
        connector: { width: '2px', height: theme.spacing.medium, backgroundColor: theme.colors.borderStrong },
        historyContainer: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}`, marginTop: isDesktop ? 0 : theme.spacing.extraLarge },
        historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.medium, cursor: isDesktop ? 'default' : 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' },
        historyTitle: { fontSize: theme.typography.fontSize.large, fontWeight: 600, color: theme.colors.primaryText, margin: 0 },
        historyContent: { padding: `0 ${theme.spacing.medium} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.small, animation: 'fadeInDown 0.3s ease-out' },
        historyItem: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium, padding: theme.spacing.medium, border: `1px solid ${theme.colors.borderStrong}` },
        historyItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.small },
        campaignNumber: { fontWeight: 700, color: theme.colors.primaryText },
        historyItemBody: { display: 'flex', flexDirection: 'column', gap: theme.spacing.extraSmall },
        historyText: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, margin: 0 },
        noHistoryText: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.medium }
    };

    const stages: { id: WorldCupStage; label: string }[] = [{ id: 'group', label: 'Fase de Grupos' }, { id: 'round_of_16', label: 'Octavos de Final' }, { id: 'quarter_finals', label: 'Cuartos de Final' }, { id: 'semi_finals', label: 'Semifinal' }, { id: 'final', label: 'Final' }];
    const getStatus = (stageId: WorldCupStage) => worldCupProgress.completedStages.includes(stageId) ? 'completed' : worldCupProgress.currentStage === stageId ? 'current' : 'locked';

    return (
      <>
        <div style={styles.headerContainer}>
            <h2 style={styles.pageTitle}>Campaña Mundial #{worldCupProgress.campaignNumber}</h2>
            <button
                onClick={onBackToSelection}
                style={styles.backButton}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${theme.colors.border}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
                &larr; Volver a la selección
            </button>
        </div>
        <div style={styles.contentWrapper}>
            <div style={styles.bracketContainer}>{stages.map((stage, index) => (<React.Fragment key={stage.id}>{stage.id === 'group' ? (<GroupStageProgress progress={worldCupProgress.groupStage} status={getStatus(stage.id)} matches={worldCupProgress.matchesByStage.group || []} />) : (<StageItem label={stage.label} status={getStatus(stage.id)} match={worldCupProgress.matchesByStage[stage.id]?.[0]} />)}{index < stages.length - 1 && <div style={styles.connector}></div>}</React.Fragment>))}{<div style={{ marginTop: theme.spacing.large }}><img src={WORLD_CUP_LOGO[theme.name]} alt="Logo de la Copa del Mundo 2026" style={{ width: '100px', height: 'auto', objectFit: 'contain' }} /></div>}</div>
            <div style={styles.historyContainer}>
              <button style={styles.historyHeader} onClick={() => setIsHistoryExpanded(prev => !prev)}>
                  <h3 style={styles.historyTitle}>Legado y palmarés</h3>{!isDesktop && <ChevronIcon isExpanded={isHistoryExpanded} />}
              </button>
              {(isDesktop || isHistoryExpanded) && (
                  <div style={styles.historyContent}>
                      {worldCupHistory && worldCupHistory.length > 0 ? ([...worldCupHistory].sort((a,b) => b.campaignNumber - a.campaignNumber).map(campaign => {
                          const isBest = campaign.finalStage === bestStageReached; 
                          return (<div key={campaign.campaignNumber} style={{...styles.historyItem, border: isBest ? `1px solid ${theme.colors.accent1}` : `1px solid ${theme.colors.borderStrong}`}}><div style={styles.historyItemHeader}><span style={styles.campaignNumber}>Mundial #{campaign.campaignNumber}</span>{isBest && <StarIcon />}</div><div style={styles.historyItemBody}><p style={styles.historyText}><strong>Etapa alcanzada:</strong> {stageLabels[campaign.finalStage]}</p><div style={{display: 'flex', alignItems: 'center', gap: theme.spacing.medium}}><p style={styles.historyText}><strong>Recorrido:</strong></p>{campaign.results.length > 0 && <MatchFormIndicator form={campaign.results} />}</div></div></div>)
                      })) : (<p style={styles.noHistoryText}>Aún no has escrito tu historia. Completa tu primera campaña para verla aquí.</p>)}
                  </div>
              )}
            </div>
        </div>
      </>
    );
};

const getDaysUntilFreeWorldCup = (lastDate?: string): number => {
    if (!lastDate) return 0;
    const last = new Date(lastDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
};

// --- Sub-component for mode selection ---
const SelectionView: React.FC<{
  onStartCampaign: () => void;
  onContinueCampaign: () => void;
  onStartWithChance: () => void;
  onStartQualifiers: () => void;
  onContinueQualifiers: () => void;
  activeMode: 'campaign' | 'qualifiers' | undefined;
  worldCupAttempts: number;
  lastFreeWorldCupDate?: string;
}> = ({ onStartCampaign, onContinueCampaign, onStartWithChance, onStartQualifiers, onContinueQualifiers, activeMode, worldCupAttempts, lastFreeWorldCupDate }) => {
    const { theme } = useTheme();
    const { playerProfile } = useData();
    const { qualifiersProgress, worldCupHistory, qualifiersHistory } = playerProfile;
    const [activeTab, setActiveTab] = useState<'mundial' | 'eliminatorias'>(activeMode === 'qualifiers' ? 'eliminatorias' : 'mundial');
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const hasAttempts = worldCupAttempts > 0;
    
    const daysUntilFree = getDaysUntilFreeWorldCup(lastFreeWorldCupDate);
    const isFreeLocked = daysUntilFree > 0 && !hasAttempts;
    
    const activeQualifiersConf = (activeMode === 'qualifiers' && qualifiersProgress) ? CONFEDERATIONS[qualifiersProgress.confederation] : null;

    const unifiedHistory = useMemo(() => {
        const wcHistory = (worldCupHistory || []).map(h => ({ ...h, type: 'worldcup' as const }));
        const qHistory = (qualifiersHistory || []).map(h => ({ ...h, type: 'qualifiers' as const }));
        return [...wcHistory, ...qHistory].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    }, [worldCupHistory, qualifiersHistory]);

    const stageLabels: Record<WorldCupStage | 'eliminated_group' | 'abandoned', string> = {
      'abandoned': 'Campaña Abandonada', 'eliminated_group': 'Fase de Grupos', 'group': 'Fase de Grupos',
      'round_of_16': 'Octavos de Final', 'quarter_finals': 'Cuartos de Final', 'semi_finals': 'Semifinal', 'final': 'Final'
    };

    const styles: { [key: string]: React.CSSProperties } = {
        pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: `0 0 ${theme.spacing.medium} 0`, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium },
        tabContainer: { position: 'relative', display: 'flex', borderBottom: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.medium },
        tabButton: { flex: 1, padding: `${theme.spacing.medium} 0`, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: theme.typography.fontSize.medium, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.small, transition: 'color 0.3s ease' },
        tabIndicator: { position: 'absolute', bottom: '-1px', height: '3px', backgroundColor: theme.colors.accent1, width: '50%', transition: 'transform 0.3s ease-out', borderRadius: '2px' },
        tabContent: { display: 'flex', flexDirection: 'column', gap: theme.spacing.medium, alignItems: 'center', textAlign: 'center'},
        modeTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: `${theme.spacing.small} 0 0 0` },
        modeDescription: { color: theme.colors.secondaryText, maxWidth: '500px', lineHeight: 1.6, margin: 0 },
        rulesList: { listStyle: 'none', padding: 0, margin: `${theme.spacing.large} 0`, display: 'flex', flexDirection: 'column', gap: theme.spacing.small, textAlign: 'left', maxWidth: '400px', width: '100%' },
        ruleItem: { display: 'flex', alignItems: 'flex-start', gap: theme.spacing.medium, backgroundColor: theme.colors.background, padding: theme.spacing.small, borderRadius: theme.borderRadius.medium },
        ruleText: { margin: 0, color: theme.colors.primaryText, fontSize: theme.typography.fontSize.small },
        actionButton: { padding: `${theme.spacing.medium} ${theme.spacing.large}`, border: `1px solid ${theme.colors.accent1}`, borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer', backgroundColor: 'transparent', color: theme.colors.accent1, transition: 'background-color 0.2s, color 0.2s, border-color 0.2s', marginTop: theme.spacing.medium },
        attemptsInfo: { fontSize: '0.8rem', color: theme.colors.accent1, fontWeight: 'bold', marginTop: '-0.5rem' },
        historyContainer: { width: '100%', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}`, marginTop: theme.spacing.extraLarge },
        historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.medium, cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' },
        historyTitle: { fontSize: theme.typography.fontSize.large, fontWeight: 600, color: theme.colors.primaryText, margin: 0 },
        historyContent: { padding: `0 ${theme.spacing.medium} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.small, animation: 'fadeInDown 0.3s ease-out' },
        historyItem: { backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium, padding: theme.spacing.medium, border: `1px solid ${theme.colors.borderStrong}` },
        historyItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.small, flexWrap: 'wrap', gap: theme.spacing.small },
        campaignNumber: { fontWeight: 700, color: theme.colors.primaryText },
        historyItemBody: { display: 'flex', flexDirection: 'column', gap: theme.spacing.extraSmall },
        historyText: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, margin: 0 },
        noHistoryText: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.medium },
        lockedButton: { opacity: 0.5, cursor: 'not-allowed', borderColor: theme.colors.borderStrong, color: theme.colors.secondaryText },
        cooldownText: { fontSize: '0.8rem', color: theme.colors.loss, fontWeight: 'bold', marginTop: '0.5rem' },
    };

    const handleWorldCupClick = () => {
        if (activeMode === 'campaign') onContinueCampaign();
        else if (hasAttempts) onStartWithChance();
        else if (!isFreeLocked) onStartCampaign();
    };

    return (
      <>
        <h2 style={styles.pageTitle}>Modo Carrera</h2>
        <div style={styles.tabContainer}>
            <button style={{...styles.tabButton, color: activeTab === 'eliminatorias' ? theme.colors.primaryText : theme.colors.secondaryText}} onClick={() => setActiveTab('eliminatorias')}>
                {activeQualifiersConf ? (<img src={activeQualifiersConf.logo[theme.name]} alt={`${activeQualifiersConf.name} logo`} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />) : (<GlobeIcon />)}
                <span>{activeQualifiersConf ? `Elim. ${qualifiersProgress?.confederation}` : 'Eliminatorias'}</span>
            </button>
            <button style={{...styles.tabButton, color: activeTab === 'mundial' ? theme.colors.primaryText : theme.colors.secondaryText}} onClick={() => setActiveTab('mundial')}>Mundial</button>
            <div style={{...styles.tabIndicator, transform: `translateX(${activeTab === 'eliminatorias' ? '0%' : '100%'})`}}/>
        </div>
        
        <div key={activeTab} style={{ animation: 'fadeInDown 0.5s ease-out', width: '100%' }}>
            {activeTab === 'mundial' && (
                <div style={styles.tabContent}>
                    <img src={WORLD_CUP_LOGO[theme.name]} alt="Logo de la Copa del Mundo 2026" style={{ width: '80px', height: 'auto', objectFit: 'contain' }} />
                    <h3 style={styles.modeTitle}>Campaña Mundial</h3>
                    <p style={styles.modeDescription}>La competición más importante del planeta. Juega la fase de grupos y avanza en el 'mata-mata' para ser leyenda.</p>
                    
                    <button 
                        onClick={handleWorldCupClick} 
                        disabled={isFreeLocked && activeMode !== 'campaign'}
                        style={{
                            ...styles.actionButton, 
                            ...(isFreeLocked && activeMode !== 'campaign' ? styles.lockedButton : {}),
                            backgroundColor: (isFreeLocked && activeMode !== 'campaign') ? 'transparent' : 'transparent'
                        }} 
                        onMouseEnter={(e) => { 
                            if (!isFreeLocked || activeMode === 'campaign') {
                                e.currentTarget.style.backgroundColor = theme.colors.accent1; 
                                e.currentTarget.style.color = theme.colors.textOnAccent;
                            }
                        }} 
                        onMouseLeave={(e) => { 
                            if (!isFreeLocked || activeMode === 'campaign') {
                                e.currentTarget.style.backgroundColor = 'transparent'; 
                                e.currentTarget.style.color = activeMode === 'campaign' ? theme.colors.accent1 : (isFreeLocked ? theme.colors.secondaryText : theme.colors.accent1);
                            }
                        }}
                    >
                        {activeMode === 'campaign' ? 'Continuar Mundial' : (hasAttempts ? `Jugar Mundial (${worldCupAttempts} chances)` : 'Jugar Mundial (Libre)')}
                    </button>
                    
                    {isFreeLocked && activeMode !== 'campaign' && (
                        <p style={styles.cooldownText}>
                            Próximo Mundial Libre en {daysUntilFree} días.
                            <br/>
                            <span style={{color: theme.colors.secondaryText, fontWeight: 'normal', fontSize: '0.75rem'}}>Juega Eliminatorias para ganar acceso inmediato.</span>
                        </p>
                    )}

                    <ul style={styles.rulesList}>
                        <li style={styles.ruleItem}><span>🏁</span> <p style={styles.ruleText}><strong>Fase de Grupos:</strong> 3 partidos a todo o nada. Suma 5 puntos para asegurar el pase.</p></li>
                        <li style={styles.ruleItem}><span>🏆</span> <p style={styles.ruleText}><strong>Fase Final:</strong> Octavos, Cuartos, Semis y Final. El que pierde, se vuelve a casa.</p></li>
                    </ul>
                </div>
            )}
            {activeTab === 'eliminatorias' && (
                <div style={styles.tabContent}>
                    {activeQualifiersConf ? (
                        <>
                            <img src={activeQualifiersConf.logo[theme.name]} alt={`${activeQualifiersConf.name} logo`} style={{ width: '80px', height: '80px', objectFit: 'contain' }}/>
                            <h3 style={styles.modeTitle}>{activeQualifiersConf.name}</h3>
                            <p style={styles.modeDescription}>{activeQualifiersConf.formatDescription}</p>
                        </>
                    ) : (
                        <>
                            <GlobeIcon size={80} color={theme.colors.accent2} />
                            <h3 style={styles.modeTitle}>Eliminatorias</h3>
                            <p style={styles.modeDescription}>Elige tu camino. Enfréntate a los formatos oficiales de las 6 confederaciones y gana tu lugar en la historia.</p>
                        </>
                    )}
                    <button onClick={activeMode === 'qualifiers' ? onContinueQualifiers : onStartQualifiers} style={{ ...styles.actionButton, borderColor: theme.colors.accent2, color: theme.colors.accent2 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.colors.accent2; e.currentTarget.style.color = theme.colors.textOnAccent;}} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.colors.accent2;}}>{activeMode === 'qualifiers' ? 'Continuar Eliminatorias' : 'Empezar Eliminatorias'}</button>
                    <ul style={styles.rulesList}>
                        <li style={styles.ruleItem}><span>🌎</span> <p style={styles.ruleText}><strong>Formato Real:</strong> Ligas, grupos y repechajes según la región que elijas.</p></li>
                        <li style={styles.ruleItem}><span>🏅</span> <p style={styles.ruleText}><strong>Recompensa:</strong> Clasificar te otorga 5 'vidas' (intentos) para jugar el Mundial sin espera.</p></li>
                        <li style={styles.ruleItem}><span>📈</span> <p style={styles.ruleText}><strong>Dificultad:</strong> Gana más puntos de carrera en confederaciones difíciles como CONMEBOL o UEFA.</p></li>
                    </ul>
                </div>
            )}
        </div>

        {unifiedHistory.length > 0 && (
          <div style={styles.historyContainer}>
              <button style={styles.historyHeader} onClick={() => setIsHistoryExpanded(prev => !prev)}>
                  <h3 style={styles.historyTitle}>Legado y palmarés</h3>
                  <ChevronIcon isExpanded={isHistoryExpanded} />
              </button>
              {isHistoryExpanded && (
                  <div style={styles.historyContent}>
                      {unifiedHistory.map(item => {
                          if (item.type === 'worldcup') {
                              const wins = item.results.filter(r => r === 'VICTORIA').length;
                              const draws = item.results.filter(r => r === 'EMPATE').length;
                              const losses = item.results.length - wins - draws;
                              
                              const statusText: Record<WorldCupCampaignHistory['status'], string> = {
                                  champion: 'Campeón 🏆',
                                  eliminated: 'Eliminado',
                                  abandoned: 'Abandonada'
                              };

                              return (
                                  <div key={`wc-${item.campaignNumber}`} style={styles.historyItem}>
                                      <div style={styles.historyItemHeader}>
                                          <span style={styles.campaignNumber}>Mundial #{item.campaignNumber}</span>
                                          <span style={{ color: item.status === 'champion' ? theme.colors.win : theme.colors.secondaryText }}>{statusText[item.status]}</span>
                                      </div>
                                      <div style={styles.historyItemBody}>
                                          <p style={styles.historyText}><strong>Etapa alcanzada:</strong> {stageLabels[item.finalStage]}</p>
                                          <p style={styles.historyText}><strong>Récord:</strong> {wins}V - {draws}E - {losses}D</p>
                                      </div>
                                  </div>
                              );
                          } else { // qualifiers
                              const conf = CONFEDERATIONS[item.confederation];
                              let statusText = 'Completada';
                              let statusColor = theme.colors.secondaryText;
                              if (item.status === 'completed') {
                                  if (item.finalPosition <= conf.slots) {
                                      statusText = 'Clasificado ✅';
                                      statusColor = theme.colors.win;
                                  } else if (item.finalPosition <= conf.slots + conf.playoffSlots) {
                                      statusText = 'Repechaje 🟠';
                                      statusColor = theme.colors.accent3;
                                  } else {
                                      statusText = 'No Clasificado';
                                      statusColor = theme.colors.loss;
                                  }
                              } else {
                                  statusText = 'Abandonada';
                              }
                              
                              return (
                                  <div key={`q-${item.campaignNumber}-${item.confederation}`} style={styles.historyItem}>
                                      <div style={styles.historyItemHeader}>
                                          <span style={styles.campaignNumber}>{conf.name} #{item.campaignNumber}</span>
                                          <span style={{ color: statusColor }}>{statusText}</span>
                                      </div>
                                      <div style={styles.historyItemBody}>
                                          <p style={styles.historyText}><strong>Posición Final:</strong> {item.finalPosition}°</p>
                                          <p style={styles.historyText}><strong>Récord:</strong> {item.record.wins}V - {item.record.draws}E - {item.record.losses}D ({item.points} pts)</p>
                                          <p style={styles.historyText}>
                                              {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                          </p>
                                      </div>
                                  </div>
                              );
                          }
                      })}
                  </div>
              )}
          </div>
        )}
      </>
    );
};


// --- Main Page Component ---
const WorldCupPage: React.FC = () => {
    const { theme } = useTheme();
    const { playerProfile, startNewWorldCupCampaign, abandonQualifiers, abandonWorldCupCampaign, startWorldCupFromQualification, startNewQualifiersCampaign } = useData();
    const { isTutorialSeen, markTutorialAsSeen } = useTutorial('worldcup');
    const [showSelectionOverride, setShowSelectionOverride] = useState(!playerProfile.activeWorldCupMode);
    const [confirmation, setConfirmation] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => Promise<void>; } | null>(null);
    const [isConfederationModalOpen, setIsConfederationModalOpen] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(!isTutorialSeen);
    
    const tutorialSteps = [
      {
          title: 'El camino a la gloria',
          content: 'Tu leyenda empieza aquí. Compite en Eliminatorias continentales o salta directo al Mundial si tienes lo necesario.',
          icon: <PlayerIcon size={48} />,
      },
      {
          title: 'Conquista continental',
          content: 'Elige tu confederación (CONMEBOL, UEFA, etc.) y sobrevive a formatos de clasificación reales para ganar tu boleto.',
          icon: <GlobeIcon size={48} />,
      },
      {
          title: 'La cita máxima',
          content: 'El escenario definitivo. Supera la fase de grupos y los cruces de eliminación directa para levantar el trofeo y saber cuánto pesa.',
          icon: <TrophyIcon size={48} />,
      }
    ];

    const handleStartCampaign = () => {
        if (playerProfile.activeWorldCupMode === 'qualifiers' && playerProfile.qualifiersProgress?.matchesPlayed > 0) {
            setConfirmation({
                isOpen: true,
                title: 'Abandonar Eliminatorias',
                message: 'Al empezar un Mundial, se abandonará tu progreso actual en las Eliminatorias. ¿Deseas continuar?',
                onConfirm: async () => {
                    await abandonQualifiers();
                    await startNewWorldCupCampaign();
                    setShowSelectionOverride(false);
                }
            });
        } else {
            startNewWorldCupCampaign();
            setShowSelectionOverride(false);
        }
    };

    const handleStartWithChance = () => {
        if (playerProfile.activeWorldCupMode === 'qualifiers' && playerProfile.qualifiersProgress?.matchesPlayed > 0) {
            setConfirmation({
                isOpen: true,
                title: 'Abandonar Eliminatorias',
                message: 'Al empezar un Mundial, se abandonará tu progreso actual en las Eliminatorias. ¿Deseas continuar?',
                onConfirm: async () => {
                    await abandonQualifiers();
                    await startWorldCupFromQualification();
                    setShowSelectionOverride(false);
                }
            });
        } else {
            startWorldCupFromQualification();
            setShowSelectionOverride(false);
        }
    };
    
    const handleStartQualifiers = () => {
        if (playerProfile.activeWorldCupMode === 'campaign' && playerProfile.worldCupProgress && (playerProfile.worldCupProgress.groupStage.matchesPlayed > 0 || Object.keys(playerProfile.worldCupProgress.matchesByStage).length > 0)) {
            setConfirmation({
                isOpen: true,
                title: 'Abandonar Mundial',
                message: 'Al empezar las Eliminatorias, se abandonará tu progreso actual en el Mundial. ¿Deseas continuar?',
                onConfirm: async () => {
                    await abandonWorldCupCampaign();
                    setIsConfederationModalOpen(true);
                }
            });
        } else {
            setIsConfederationModalOpen(true);
        }
    };

    const handleContinueCampaign = () => {
        if (playerProfile.activeWorldCupMode === 'campaign') {
            setShowSelectionOverride(false);
        }
    };
    const handleContinueQualifiers = () => {
        if (playerProfile.activeWorldCupMode === 'qualifiers') {
            setShowSelectionOverride(false);
        }
    };

    const styles: { [key: string]: React.CSSProperties } = {
        container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    };

    const { activeWorldCupMode, worldCupProgress, qualifiersProgress } = playerProfile;

    useEffect(() => {
        if (!activeWorldCupMode) {
            setShowSelectionOverride(true);
        }
    }, [activeWorldCupMode]);

    const renderView = () => {
        if (!activeWorldCupMode || showSelectionOverride) {
            return <SelectionView 
                onStartCampaign={handleStartCampaign} 
                onContinueCampaign={handleContinueCampaign} 
                onStartWithChance={handleStartWithChance} 
                onStartQualifiers={handleStartQualifiers} 
                onContinueQualifiers={handleContinueQualifiers} 
                activeMode={activeWorldCupMode} 
                worldCupAttempts={playerProfile.worldCupAttempts || 0}
                lastFreeWorldCupDate={playerProfile.lastFreeWorldCupDate}
            />;
        }
        if (activeWorldCupMode === 'campaign' && worldCupProgress) {
            return <CampaignView onBackToSelection={() => setShowSelectionOverride(true)} />;
        }
        if (activeWorldCupMode === 'qualifiers' && qualifiersProgress) {
            return <QualifiersView onBackToSelection={() => setShowSelectionOverride(true)} onShowTutorial={() => setIsTutorialOpen(true)} />;
        }
        return <SelectionView onStartCampaign={handleStartCampaign} onContinueCampaign={handleContinueCampaign} onStartWithChance={handleStartWithChance} onStartQualifiers={handleStartQualifiers} onContinueQualifiers={handleContinueQualifiers} activeMode={activeWorldCupMode} worldCupAttempts={playerProfile.worldCupAttempts || 0} lastFreeWorldCupDate={playerProfile.lastFreeWorldCupDate} />;
    };
    
    return (
        <main style={styles.container}>
            <TutorialModal 
                isOpen={isTutorialOpen}
                onClose={(dontShowAgain) => {
                    setIsTutorialOpen(false);
                    if(dontShowAgain) markTutorialAsSeen();
                }}
                steps={tutorialSteps}
            />
            <style>{`@keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {renderView()}
            {confirmation?.isOpen && (
                <ConfirmationModal
                    isOpen={confirmation.isOpen}
                    onClose={() => setConfirmation(null)}
                    onConfirm={confirmation.onConfirm}
                    title={confirmation.title}
                    message={confirmation.message}
                />
            )}
            <ConfederationSelectModal 
                isOpen={isConfederationModalOpen}
                onClose={() => setIsConfederationModalOpen(false)}
                onSelect={async (conf) => {
                    setIsConfederationModalOpen(false);
                    await startNewQualifiersCampaign(conf);
                    setShowSelectionOverride(false);
                }}
            />
        </main>
    );
};

export default WorldCupPage;

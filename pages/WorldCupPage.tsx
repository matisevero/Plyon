
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import GroupStageProgress from './worldcup/GroupStageProgress';
import StageItem from './worldcup/StageItem';
import ChampionCelebration from './worldcup/ChampionCelebration';
import QualifiersView from './worldcup/QualifiersView';
import ConfederationSelectModal from '../components/modals/ConfederationSelectModal';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { GlobeIcon } from '../components/icons/GlobeIcon';
import { ChevronIcon } from '../components/icons/ChevronIcon';
import { InfoIcon } from '../components/icons/InfoIcon';
import Card from '../components/common/Card';
import TutorialModal from '../components/modals/TutorialModal';
import { useTutorial } from '../hooks/useTutorial';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import SegmentedControl from '../components/common/SegmentedControl';
import type { WorldCupStage, ConfederationName } from '../types';
import SectionHelp from '../components/common/SectionHelp';
import { CONFEDERATIONS, WORLD_CUP_LOGO, parseLocalDate } from '../utils/analytics';
import { CheckIcon } from '../components/icons/CheckIcon';
import { LockIcon } from '../components/icons/LockIcon';

const WorldCupPage: React.FC = () => {
  const { theme } = useTheme();
  const { playerProfile, startNewWorldCupCampaign, startNewQualifiersCampaign, abandonWorldCupCampaign, isShareMode, updatePlayerProfile } = useData();
  const { isTutorialSeen, markTutorialAsSeen } = useTutorial('worldcup');
  
  const [isConfederationModalOpen, setIsConfederationModalOpen] = useState(false);
  const [isAbandonConfirmOpen, setIsAbandonConfirmOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(!isTutorialSeen && !isShareMode);
  
  // Selection Screen State
  const [activeTab, setActiveTab] = useState<'qualifiers' | 'worldcup'>('qualifiers');
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const { activeWorldCupMode, worldCupProgress, qualifiersProgress, worldCupAttempts } = playerProfile;

  const tutorialSteps = [
      {
          title: 'Modo Carrera',
          content: 'Vive la experiencia de ser un futbolista profesional. Juega eliminatorias y clasifica al Mundial.',
          icon: <TrophyIcon size={48} />,
      },
      {
          title: 'Eliminatorias',
          content: 'Elige tu confederación (CONMEBOL, UEFA, etc.) y lucha por un cupo. La dificultad y los premios varían.',
          icon: <GlobeIcon size={48} />,
      },
      {
          title: 'La Copa del Mundo',
          content: 'Si clasificas, jugarás el torneo más importante. Fase de grupos y eliminatorias directas hasta la gloria.',
          icon: <TrophyIcon size={48} />,
      }
  ];

  // Logic to handle Qualifiers Click
  const handleQualifiersClick = () => {
      if (qualifiersProgress && qualifiersProgress.status === 'active') {
          updatePlayerProfile({ activeWorldCupMode: 'qualifiers' });
      } else {
          setIsConfederationModalOpen(true);
      }
  };

  const handleConfederationSelect = async (conf: ConfederationName) => {
      setIsConfederationModalOpen(false);
      await startNewQualifiersCampaign(conf);
  };

  // Logic to handle World Cup Click
  const handleWorldCupClick = async () => {
      if (worldCupProgress) {
          updatePlayerProfile({ activeWorldCupMode: 'campaign' });
      } else {
          await startNewWorldCupCampaign();
      }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.medium },
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium, display: 'flex', alignItems: 'center' },
    actions: { display: 'flex', gap: theme.spacing.medium, alignItems: 'center' },
    iconButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
    
    // --- LOBBY STYLES ---
    lobbyCard: {
        backgroundColor: theme.colors.surface, 
        borderRadius: theme.borderRadius.large,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.medium,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
    },
    lobbyContent: {
        padding: theme.spacing.large,
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        width: '100%', boxSizing: 'border-box'
    },
    logoWrapper: {
        width: '100px', height: '100px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: theme.spacing.medium,
        animation: 'fadeIn 0.5s ease-out',
    },
    logoImage: { width: '100%', height: '100%', objectFit: 'contain' },
    lobbyTitle: { 
        fontSize: theme.typography.fontSize.extraLarge, 
        fontWeight: 700, 
        color: theme.colors.primaryText, 
        margin: `0 0 ${theme.spacing.small} 0`, 
        textAlign: 'center',
    },
    lobbyDescription: { 
        color: theme.colors.secondaryText, 
        textAlign: 'center', 
        fontSize: theme.typography.fontSize.medium,
        lineHeight: 1.5,
        margin: `0 0 ${theme.spacing.large} 0`,
        maxWidth: '500px'
    },
    
    // Vertical Info List
    infoList: {
        display: 'flex', flexDirection: 'column', gap: theme.spacing.medium,
        width: '100%', maxWidth: '400px',
        backgroundColor: theme.colors.background,
        padding: theme.spacing.medium,
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.border}`,
        marginBottom: theme.spacing.large
    },
    infoItem: {
        display: 'flex', alignItems: 'center', gap: theme.spacing.medium,
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.primaryText
    },
    infoIcon: {
        color: theme.colors.accent2,
        display: 'flex', alignItems: 'center'
    },
    
    // Buttons
    mainButton: { 
        padding: `${theme.spacing.medium} ${theme.spacing.large}`, 
        borderRadius: theme.borderRadius.medium, 
        border: 'none', 
        fontWeight: 700, 
        fontSize: theme.typography.fontSize.medium, 
        cursor: 'pointer',
        boxShadow: theme.shadows.small, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        backgroundColor: theme.colors.accent1,
        color: theme.colors.textOnAccent,
        width: '100%', maxWidth: '300px'
    },
    secondaryButton: {
        marginTop: theme.spacing.medium,
        background: 'none',
        border: 'none',
        color: theme.colors.secondaryText,
        textDecoration: 'underline',
        cursor: 'pointer',
        fontSize: theme.typography.fontSize.small
    },
    
    // History
    historySection: { 
        width: '100%', 
        borderTop: `1px solid ${theme.colors.border}`, 
    },
    historyToggle: { 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: theme.spacing.medium, cursor: 'pointer',
        color: theme.colors.secondaryText, fontWeight: 600, fontSize: theme.typography.fontSize.small,
        width: '100%', background: 'none', border: 'none',
        textTransform: 'uppercase', letterSpacing: '0.05em'
    },
    historyList: { 
        display: 'flex', flexDirection: 'column', 
        backgroundColor: theme.colors.background,
        borderTop: `1px solid ${theme.colors.border}`,
        maxHeight: '300px', overflowY: 'auto'
    },
    historyItem: { 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: theme.spacing.medium, 
        borderBottom: `1px solid ${theme.colors.border}`,
        fontSize: theme.typography.fontSize.small
    },
    
    // In-Game Styles
    stagesContainer: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large, alignItems: 'center' },
    stagesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: theme.spacing.large, width: '100%', justifyContent: 'center' },
  };

  // 1. ACTIVE GAME VIEW (Qualifiers or World Cup)
  if (activeWorldCupMode === 'qualifiers') {
      return (
        <>
            <TutorialModal isOpen={isTutorialOpen} onClose={(dontShowAgain) => { setIsTutorialOpen(false); if(dontShowAgain) markTutorialAsSeen(); }} steps={tutorialSteps} />
            <main style={styles.container}>
                <QualifiersView 
                    onBackToSelection={() => updatePlayerProfile({ activeWorldCupMode: undefined })} 
                    onShowTutorial={() => setIsTutorialOpen(true)} 
                    onOpenHistory={() => {}} 
                />
            </main>
        </>
      );
  }

  if (activeWorldCupMode === 'campaign' && worldCupProgress) {
      if (worldCupProgress.championOfCampaign) {
          return <ChampionCelebration onNextCampaign={handleWorldCupClick} />;
      }

      const getMatchForStage = (stage: string) => {
          const stageMatches = worldCupProgress.matchesByStage[stage];
          if (stageMatches && stageMatches.length > 0) {
              return stageMatches[stageMatches.length - 1];
          }
          return undefined;
      };

      const getStageStatus = (stage: WorldCupStage) => {
          if (worldCupProgress.completedStages.includes(stage)) return 'completed';
          if (worldCupProgress.currentStage === stage) return 'current';
          return 'locked';
      };

      return (
        <>
            <TutorialModal isOpen={isTutorialOpen} onClose={(dontShowAgain) => { setIsTutorialOpen(false); if(dontShowAgain) markTutorialAsSeen(); }} steps={tutorialSteps} />
            <main style={styles.container}>
                <div style={styles.header}>
                    <div style={{display: 'flex', alignItems: 'center', gap: theme.spacing.medium}}>
                        <button onClick={() => updatePlayerProfile({ activeWorldCupMode: undefined })} style={{...styles.iconButton, fontSize: '0.9rem', fontWeight: 600}}>
                            ← Volver
                        </button>
                        <h2 style={{...styles.pageTitle, borderLeft: 'none', paddingLeft: 0}}>
                            Copa Mundial #{worldCupProgress.campaignNumber}
                            <SectionHelp steps={tutorialSteps} />
                        </h2>
                    </div>
                    <div style={styles.actions}>
                        <button onClick={() => setIsAbandonConfirmOpen(true)} style={{...styles.iconButton, color: theme.colors.loss}} title="Abandonar"><InfoIcon size={24} /></button>
                    </div>
                </div>

                <div style={styles.stagesContainer}>
                    <GroupStageProgress 
                        progress={worldCupProgress.groupStage} 
                        status={getStageStatus('group')} 
                        matches={worldCupProgress.matchesByStage['group'] || []}
                    />
                    
                    <div style={styles.stagesGrid}>
                        <StageItem label="Octavos de Final" status={getStageStatus('round_of_16')} match={getMatchForStage('round_of_16')} />
                        <StageItem label="Cuartos de Final" status={getStageStatus('quarter_finals')} match={getMatchForStage('quarter_finals')} />
                        <StageItem label="Semifinal" status={getStageStatus('semi_finals')} match={getMatchForStage('semi_finals')} />
                        <StageItem label="Gran Final" status={getStageStatus('final')} match={getMatchForStage('final')} />
                    </div>
                </div>
            </main>
            <ConfirmationModal 
                isOpen={isAbandonConfirmOpen} 
                onClose={() => setIsAbandonConfirmOpen(false)} 
                onConfirm={abandonWorldCupCampaign} 
                title="Abandonar Mundial" 
                message="¿Estás seguro? Perderás el progreso actual." 
            />
        </>
      );
  }

  // 2. LOBBY VIEW (Selection)
  const attempts = worldCupAttempts || 0;
  const canPlayDirectly = attempts > 0;
  
  const hasActiveQualifiers = qualifiersProgress && qualifiersProgress.status === 'active';
  const hasActiveWorldCup = !!worldCupProgress;

  // Resolve Content based on Tab
  let currentLogo = <GlobeIcon size={80} color={theme.colors.secondaryText} />;
  let currentConfData = null;

  if (activeTab === 'worldcup') {
      const wcLogo = WORLD_CUP_LOGO[theme.name];
      if (wcLogo) currentLogo = <img src={wcLogo} style={styles.logoImage} alt="Mundial" />;
      else currentLogo = <TrophyIcon size={80} color={theme.colors.accent1} />;
  } else {
      // Qualifiers Logic
      if (hasActiveQualifiers) {
         const conf = CONFEDERATIONS[qualifiersProgress.confederation];
         currentConfData = conf;
         const confLogo = conf?.logo?.[theme.name];
         if (confLogo) currentLogo = <img src={confLogo} style={styles.logoImage} alt={conf.name} />;
         else currentLogo = <GlobeIcon size={80} color={theme.colors.accent2} />;
      } else {
         currentLogo = <GlobeIcon size={80} color={theme.colors.accent2} />;
      }
  }

  return (
    <>
        <TutorialModal isOpen={isTutorialOpen} onClose={(dontShowAgain) => { setIsTutorialOpen(false); if(dontShowAgain) markTutorialAsSeen(); }} steps={tutorialSteps} />
        <ConfederationSelectModal isOpen={isConfederationModalOpen} onClose={() => setIsConfederationModalOpen(false)} onSelect={handleConfederationSelect} />
        
        <main style={styles.container}>
            <div style={styles.header}>
                <div style={{display: 'flex', alignItems: 'center', gap: theme.spacing.medium}}>
                    <h2 style={styles.pageTitle}>
                        Modo Carrera
                        <SectionHelp steps={tutorialSteps} />
                    </h2>
                </div>
            </div>

            {/* Top Tabs */}
            <div style={{width: '100%', maxWidth: '500px', margin: '0 auto'}}>
                <SegmentedControl 
                    options={[
                        { label: 'Eliminatorias', value: 'qualifiers' }, 
                        { label: 'Copa Mundial', value: 'worldcup' }
                    ]}
                    selectedValue={activeTab}
                    onSelect={(v) => { setActiveTab(v as any); setIsHistoryExpanded(false); }}
                />
            </div>

            {/* Main Lobby Card */}
            <div style={styles.lobbyCard}>
                <div style={styles.lobbyContent}>
                    <div style={styles.logoWrapper}>
                        {currentLogo}
                    </div>

                    {activeTab === 'qualifiers' && (
                        <>
                            <h3 style={styles.lobbyTitle}>
                                {hasActiveQualifiers ? currentConfData?.name : "Eliminatorias"}
                            </h3>
                            <p style={styles.lobbyDescription}>
                                {hasActiveQualifiers
                                    ? `Campaña en curso. Continúa tu lucha por la clasificación.`
                                    : "Elige tu confederación y gana tu lugar en el torneo más importante."}
                            </p>
                            
                            <div style={styles.infoList}>
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}><GlobeIcon size={18}/></span>
                                    <span><strong>Formato:</strong> {hasActiveQualifiers ? currentConfData?.formatDescription : 'Liga o Grupos según región'}</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}><TrophyIcon size={18}/></span>
                                    <span><strong>Dificultad:</strong> {hasActiveQualifiers ? currentConfData?.difficulty : 'Variable'}</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}><CheckIcon size={18}/></span>
                                    <span><strong>Cupos:</strong> {hasActiveQualifiers ? `${currentConfData?.slots} directos` : 'Varía por región'}</span>
                                </div>
                            </div>

                            {!isShareMode && (
                                <button 
                                    onClick={handleQualifiersClick} 
                                    style={styles.mainButton}
                                >
                                    {hasActiveQualifiers ? 'Continuar Campaña' : 'Nueva Campaña'}
                                </button>
                            )}
                        </>
                    )}

                    {activeTab === 'worldcup' && (
                        <>
                            <h3 style={styles.lobbyTitle}>Copa Mundial</h3>
                            <p style={styles.lobbyDescription}>
                                {hasActiveWorldCup
                                    ? "Estás disputando la Copa del Mundo. ¡Cada partido es una final!"
                                    : "El torneo definitivo. Enfréntate a los mejores del planeta."}
                            </p>
                            
                            <div style={styles.infoList}>
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}><GlobeIcon size={18}/></span>
                                    <span><strong>Formato:</strong> Fase de Grupos + Eliminación Directa</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}><TrophyIcon size={18}/></span>
                                    <span><strong>Recompensa:</strong> Puntos de Carrera x10</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <span style={styles.infoIcon}>{canPlayDirectly ? <CheckIcon size={18} color={theme.colors.win} /> : <LockIcon size={18} color={theme.colors.secondaryText} />}</span>
                                    <span>
                                        <strong>Estado:</strong> {canPlayDirectly ? `Clasificado (${attempts} intentos)` : 'Bloqueado (Requiere clasificación)'}
                                    </span>
                                </div>
                            </div>

                            {!isShareMode && (
                                <>
                                    <button 
                                        onClick={handleWorldCupClick} 
                                        disabled={!canPlayDirectly && !hasActiveWorldCup}
                                        style={{
                                            ...styles.mainButton, 
                                            background: (canPlayDirectly || hasActiveWorldCup) ? theme.colors.accent1 : theme.colors.borderStrong,
                                            cursor: (canPlayDirectly || hasActiveWorldCup) ? 'pointer' : 'not-allowed',
                                            opacity: (canPlayDirectly || hasActiveWorldCup) ? 1 : 0.7,
                                            color: (canPlayDirectly || hasActiveWorldCup) ? theme.colors.textOnAccent : theme.colors.secondaryText
                                        }}
                                    >
                                        {hasActiveWorldCup ? 'Continuar Mundial' : (canPlayDirectly ? 'Jugar Mundial (Clasificado)' : 'Bloqueado')}
                                    </button>
                                    
                                    {!hasActiveWorldCup && (
                                        <button 
                                            onClick={handleWorldCupClick} 
                                            style={styles.secondaryButton}
                                        >
                                            Jugar modo libre (Amistoso)
                                        </button>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Expandable History */}
                <div style={styles.historySection}>
                    <button 
                        style={styles.historyToggle} 
                        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    >
                        <span>Historial de {activeTab === 'qualifiers' ? 'Eliminatorias' : 'Mundiales'}</span>
                        <ChevronIcon isExpanded={isHistoryExpanded} />
                    </button>
                    
                    {isHistoryExpanded && (
                        <div style={styles.historyList}>
                            {activeTab === 'qualifiers' && playerProfile.qualifiersHistory?.slice().reverse().map((h, i) => (
                                <div key={i} style={styles.historyItem}>
                                    <div style={{display:'flex', flexDirection:'column'}}>
                                        <span style={{fontWeight:'bold'}}>{h.confederation} #{h.campaignNumber}</span>
                                        <span style={{fontSize:'0.75rem', color: theme.colors.secondaryText}}>{parseLocalDate(h.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <span style={{fontWeight: 700, color: h.finalPosition <= CONFEDERATIONS[h.confederation].slots ? theme.colors.win : theme.colors.secondaryText}}>
                                        {h.status === 'abandoned' ? 'Abandonado' : (h.finalPosition <= CONFEDERATIONS[h.confederation].slots ? 'Clasificado' : 'Eliminado')}
                                    </span>
                                </div>
                            ))}
                            {activeTab === 'qualifiers' && (!playerProfile.qualifiersHistory || playerProfile.qualifiersHistory.length === 0) && (
                                <div style={{padding: theme.spacing.medium, textAlign: 'center', color: theme.colors.secondaryText, fontStyle: 'italic'}}>No hay historial.</div>
                            )}

                            {activeTab === 'worldcup' && playerProfile.worldCupHistory?.slice().reverse().map((h, i) => {
                                    let resultText = 'Eliminado';
                                    let color = theme.colors.loss;
                                    if (h.status === 'champion') { resultText = '🏆 CAMPEÓN'; color = theme.colors.win; }
                                    else if (h.status === 'abandoned') { resultText = 'Abandonado'; color = theme.colors.secondaryText; }
                                    else if (h.finalStage === 'final') { resultText = 'Subcampeón'; color = theme.colors.accent3; }
                                    else if (h.finalStage === 'semi_finals') { resultText = 'Semifinales'; color = theme.colors.accent2; }
                                    
                                    return (
                                    <div key={i} style={styles.historyItem}>
                                        <div style={{display:'flex', flexDirection:'column'}}>
                                            <span style={{fontWeight:'bold'}}>Mundial #{h.campaignNumber}</span>
                                            <span style={{fontSize:'0.75rem', color: theme.colors.secondaryText}}>{parseLocalDate(h.endDate).toLocaleDateString()}</span>
                                        </div>
                                        <span style={{fontWeight: 700, color}}>
                                            {resultText}
                                        </span>
                                    </div>
                                    );
                            })}
                            {activeTab === 'worldcup' && (!playerProfile.worldCupHistory || playerProfile.worldCupHistory.length === 0) && (
                                <div style={{padding: theme.spacing.medium, textAlign: 'center', color: theme.colors.secondaryText, fontStyle: 'italic'}}>No hay historial.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    </>
  );
};

export default WorldCupPage;

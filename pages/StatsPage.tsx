
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { AIHighlight, CoachingInsight } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { generateHighlightsSummary, generateCoachingInsight } from '../services/geminiService';
import HighlightCard from '../components/HighlightCard';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Loader } from '../components/Loader';
import Card from '../components/common/Card';
import HistoricalAnalysis from './stats/HistoricalAnalysis';
import { ChatBubbleIcon } from '../components/icons/ChatBubbleIcon';
import SeasonalComparison from './stats/SeasonalComparison';
import SummaryWidget from './stats/SummaryWidget';
import ContributionMetricsWidget from './stats/ContributionMetricsWidget';
import ActivityCalendar from './stats/ActivityCalendar';
import MomentumWidget from './stats/MomentumWidget';
import ConsistencyWidget from './stats/ConsistencyWidget';
import StreaksWidget from './stats/StreaksWidget';
import { useTutorial } from '../hooks/useTutorial';
import TutorialModal from '../components/modals/TutorialModal';
import { BarChartIcon } from '../components/icons/BarChartIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { InfoIcon } from '../components/icons/InfoIcon';
import { ShareIcon } from '../components/icons/ShareIcon';
import ShareViewModal from '../components/modals/ShareViewModal';
import SectionHelp from '../components/common/SectionHelp';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';

type WidgetId = 'summary' | 'contributionMetrics' | 'streaks' | 'calendar' | 'historical' | 'seasonalComparison' | 'momentum' | 'ai';

const WIDGET_ORDER: WidgetId[] = ['summary', 'streaks', 'contributionMetrics', 'momentum', 'seasonalComparison', 'calendar', 'historical', 'ai'];

const StatsPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, addAIInteraction, playerProfile, isShareMode, checkAILimit, aiUsageCount, AI_MONTHLY_LIMIT } = useData();
  const { isTutorialSeen, markTutorialAsSeen } = useTutorial('stats');
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1200);
  const [highlights, setHighlights] = useState<AIHighlight[]>([]);
  const [isGeneratingHighlights, setIsGeneratingHighlights] = useState(false);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(!isTutorialSeen && !isShareMode);
  
  // Sync tutorial state
  useEffect(() => {
      if (isTutorialSeen) setIsTutorialOpen(false);
  }, [isTutorialSeen]);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [coachingInsight, setCoachingInsight] = useState<CoachingInsight | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const tutorialSteps = [
    {
        title: 'Tu identidad como jugador',
        content: 'Más allá de los números, aquí descubrirás qué tipo de jugador eres. ¿Eres constante? ¿Apareces en momentos clave? ¿Mejoras cada año?',
        icon: <BarChartIcon size={48} />,
    },
    {
        title: 'Análisis avanzado',
        content: 'Desde mapas de calor de actividad hasta índices de consistencia avanzados. Entiende tus rachas y detecta patrones en tu juego.',
        icon: <TrendingUpIcon size={48} />,
    },
    {
        title: 'IA Deportiva',
        content: 'Usa nuestra Inteligencia Artificial para recibir feedback táctico personalizado y revivir tus Highlights más memorables.',
        icon: <SparklesIcon size={48} />,
    }
  ];

  const historicalGuide = [
      { title: "Desglose Mensual", content: "Profundiza en tus datos. Despliega cada año para ver tu rendimiento mes a mes.", icon: <CalendarIcon size={48} /> },
      { title: "Detalle de Partidos", content: "Al expandir un mes, verás la lista de partidos jugados con sus estadísticas individuales.", icon: <ClipboardIcon size={48} /> }
  ];

  const aiGuide = [
      { title: "Highlights", content: "La IA analiza tus partidos recientes para encontrar tus mejores actuaciones y explicarte por qué fuiste clave.", icon: <SparklesIcon size={48} /> },
      { title: "Coach Virtual", content: "Recibe un consejo táctico basado en tus tendencias recientes. Descubre qué estás haciendo bien y qué puedes mejorar.", icon: <ChatBubbleIcon size={48} /> }
  ];

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allPlayers = useMemo(() => {
    const players = new Set<string>();
    matches.forEach(match => {
      match.myTeamPlayers?.forEach(p => {
        if (p && p.name.trim() && p.name.toLowerCase() !== (playerProfile.name || '').toLowerCase()) {
          players.add(p.name.trim());
        }
      });
      match.opponentPlayers?.forEach(p => {
        if (p && p.name.trim()) {
          players.add(p.name.trim());
        }
      });
    });
    return Array.from(players).sort();
  }, [matches, playerProfile.name]);
  
  const handleAnalyzePerformance = useCallback(async () => {
    try {
      checkAILimit();
      setIsGeneratingHighlights(true);
      setHighlightsError(null);
      const result = await generateHighlightsSummary(matches);
      const populatedHighlights = result.map(h => ({ ...h, match: matches.find(m => m.id === h.matchId)! })).filter(h => h.match);
      setHighlights(populatedHighlights);
      await addAIInteraction('highlight_analysis', populatedHighlights);
    } catch (err: any) { setHighlightsError(err.message || "Error al generar el análisis."); }
    finally { setIsGeneratingHighlights(false); }
  }, [matches, addAIInteraction, checkAILimit]);

  const handleGetCoachingInsight = useCallback(async () => {
    try {
        checkAILimit();
        setIsGeneratingInsight(true);
        setInsightError(null);
        const result = await generateCoachingInsight(matches);
        setCoachingInsight(result);
        await addAIInteraction('coach_insight', result);
    } catch (err: any) { setInsightError(err.message || "Error al generar la perspectiva."); }
    finally { setIsGeneratingInsight(false); }
  }, [matches, addAIInteraction, checkAILimit]);

  const aiWidget = (
    <Card title={<>Análisis con IA <SectionHelp steps={aiGuide} /></>}>
      {highlights.length === 0 && !isGeneratingHighlights && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: theme.colors.secondaryText, margin: `0 0 ${theme.spacing.large} 0`, lineHeight: 1.6 }}>Descubre tus partidos más determinantes.</p>
          <button onClick={handleAnalyzePerformance} style={{ background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`, border: 'none', color: theme.name === 'dark' ? '#121829' : '#FFFFFF', padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderRadius: theme.borderRadius.medium, cursor: 'pointer', fontWeight: 700, fontSize: theme.typography.fontSize.medium, display: 'inline-flex', alignItems: 'center', gap: theme.spacing.small, transition: 'opacity 0.2s' }} disabled={matches.length < 3 || isShareMode}>
          <SparklesIcon /> {matches.length < 3 ? 'necesitas 3 partidos' : 'Analizar Highlights'}
          </button>
          <div style={{fontSize: '0.75rem', color: theme.colors.secondaryText, marginTop: '0.5rem'}}>Usos mensuales: {aiUsageCount}/{AI_MONTHLY_LIMIT}</div>
        </div>
      )}
      {isGeneratingHighlights && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', color: theme.colors.secondaryText, padding: theme.spacing.extraLarge }}><Loader /> <p>Analizando...</p></div>}
      {highlightsError && <p style={{ color: theme.colors.loss, textAlign: 'center', padding: theme.spacing.medium, backgroundColor: `${theme.colors.loss}1A`, borderRadius: theme.borderRadius.medium }}>{highlightsError}</p>}
      {highlights.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: theme.spacing.large }}>{highlights.map(h => <HighlightCard key={h.matchId} highlight={h} allMatches={matches} allPlayers={allPlayers} />)}</div>}
      <div style={{ borderTop: `1px solid ${theme.colors.border}`, marginTop: '1.5rem', paddingTop: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', textAlign: 'center', color: theme.colors.secondaryText, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><ChatBubbleIcon size={20} /> Perspectiva del Entrenador</h4>
        {coachingInsight ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><h5 style={{ margin: '0 0 0.5rem 0', color: theme.colors.win }}>📈 Tendencia positiva</h5><p style={{ margin: 0, color: theme.colors.primaryText, lineHeight: 1.6 }}>{coachingInsight.positiveTrend}</p></div>
            <div><h5 style={{ margin: '0 0 0.5rem 0', color: theme.colors.draw }}>🎯 Área de mejora</h5><p style={{ margin: 0, color: theme.colors.primaryText, lineHeight: 1.6 }}>{coachingInsight.areaForImprovement}</p></div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: theme.colors.secondaryText, margin: `0 0 ${theme.spacing.large} 0`, lineHeight: 1.6, fontSize: '0.9rem' }}>Obtén un análisis rápido de la IA.</p>
            <button onClick={handleGetCoachingInsight} style={{ background: 'none', border: `1px solid ${theme.colors.borderStrong}`, color: theme.colors.primaryText, padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderRadius: theme.borderRadius.medium, cursor: 'pointer', fontWeight: 700, fontSize: theme.typography.fontSize.small, display: 'inline-flex', alignItems: 'center', gap: theme.spacing.small, transition: 'background-color 0.2s' }} disabled={isGeneratingInsight || matches.length < 5 || isShareMode}>
                {isGeneratingInsight ? <Loader /> : <SparklesIcon />}
                {matches.length < 5 ? 'necesitas 5 partidos' : 'Obtener consejo'}
            </button>
            <div style={{fontSize: '0.75rem', color: theme.colors.secondaryText, marginTop: '0.5rem'}}>Usos mensuales: {aiUsageCount}/{AI_MONTHLY_LIMIT}</div>
          </div>
        )}
        {isGeneratingInsight && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', color: theme.colors.secondaryText, padding: theme.spacing.large }}><Loader /> <p>Generando...</p></div>}
        {insightError && <p style={{ color: theme.colors.loss, textAlign: 'center', padding: theme.spacing.medium, backgroundColor: `${theme.colors.loss}1A`, borderRadius: theme.borderRadius.medium }}>{insightError}</p>}
      </div>
      <div style={{ borderTop: `1px solid ${theme.colors.border}`, marginTop: '1.5rem', paddingTop: '1.5rem' }}>
        <ConsistencyWidget matches={matches} />
      </div>
    </Card>
  );

  const widgetComponents: Record<WidgetId, React.ReactNode> = { 
      summary: <SummaryWidget matches={matches} />, 
      contributionMetrics: <ContributionMetricsWidget matches={matches} />, 
      streaks: <StreaksWidget matches={matches} />, 
      calendar: <ActivityCalendar matches={matches} />, 
      historical: <Card title={<>Desglose histórico <SectionHelp steps={historicalGuide} /></>}><HistoricalAnalysis matches={matches} /></Card>, 
      seasonalComparison: <SeasonalComparison matches={matches} />, 
      momentum: <MomentumWidget matches={matches} />, 
      ai: aiWidget 
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1600px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent2}`, paddingLeft: '1rem', display: 'flex', alignItems: 'center' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
    headerButtons: { display: 'flex', alignItems: 'center', gap: theme.spacing.small },
    iconButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
    contentContainer: { overflow: 'hidden' },
    dashboardList: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: theme.spacing.large, alignItems: 'start' },
    column: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large }
  };

  return (
    <>
      <TutorialModal isOpen={isTutorialOpen} onClose={(dontShowAgain) => { setIsTutorialOpen(false); if(dontShowAgain) markTutorialAsSeen(); }} steps={tutorialSteps} />
      <ShareViewModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} page="stats" />
      <main style={isDesktop ? styles.container : {...styles.container, maxWidth: '800px'}}>
        <div style={isDesktop ? styles.header : {...styles.header, flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.medium }}>
                <h2 style={styles.pageTitle}>
                    Estadísticas
                    <SectionHelp steps={[
                        { title: 'Estadísticas', content: 'Tu centro de mando. Aquí tienes todas las métricas que definen tu rendimiento.', icon: <BarChartIcon size={48} /> },
                        { title: 'Filtros', content: 'Usa los filtros de año dentro de cada tarjeta para ver datos específicos de una temporada.', icon: <InfoIcon size={48} /> }
                    ]} />
                </h2>
                {!isShareMode && (
                    <div style={styles.headerButtons}>
                      <button onClick={() => setIsShareModalOpen(true)} style={styles.iconButton} aria-label="Compartir vista"><ShareIcon color={theme.colors.secondaryText} size={20} /></button>
                      <button onClick={() => setIsTutorialOpen(true)} style={styles.iconButton} aria-label="Mostrar guía"><InfoIcon color={theme.colors.secondaryText} size={20}/></button>
                    </div>
                )}
            </div>
        </div>
        <div style={styles.contentContainer}>
            <div>
                {isDesktop ? (
                    <div style={styles.dashboardGrid}>
                        <div style={styles.column}>{widgetComponents.summary}{widgetComponents.streaks}</div>
                        <div style={styles.column}>{widgetComponents.contributionMetrics}{widgetComponents.seasonalComparison}{widgetComponents.momentum}</div>
                        <div style={styles.column}>{widgetComponents.calendar}{widgetComponents.historical}{widgetComponents.ai}</div>
                    </div>
                ) : (
                <div style={styles.dashboardList}>{WIDGET_ORDER.map(id => <div key={id}>{widgetComponents[id]}</div>)}</div>
                )}
            </div>
        </div>
      </main>
    </>
  );
};

export default StatsPage;

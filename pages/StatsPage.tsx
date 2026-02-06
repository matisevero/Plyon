import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { AIHighlight, CoachingInsight } from '../types';
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
import s from './StatsPage.module.css';

type WidgetId = 'summary' | 'contributionMetrics' | 'streaks' | 'calendar' | 'historical' | 'seasonalComparison' | 'momentum' | 'ai';

const WIDGET_ORDER: WidgetId[] = ['summary', 'streaks', 'contributionMetrics', 'momentum', 'seasonalComparison', 'calendar', 'historical', 'ai'];

const StatsPage: React.FC = () => {
  const { matches, addAIInteraction, playerProfile, isShareMode, checkAILimit, aiUsageCount, AI_MONTHLY_LIMIT } = useData();
  const { isTutorialSeen, markTutorialAsSeen } = useTutorial('stats');
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1200);
  const [highlights, setHighlights] = useState<AIHighlight[]>([]);
  const [isGeneratingHighlights, setIsGeneratingHighlights] = useState(false);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(!isTutorialSeen && !isShareMode);
  
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
      content: 'Mas alla de los numeros, aqui descubriras que tipo de jugador eres. Eres constante? Apareces en momentos clave? Mejoras cada ano?',
      icon: <BarChartIcon size={48} />,
    },
    {
      title: 'Analisis avanzado',
      content: 'Desde mapas de calor de actividad hasta indices de consistencia avanzados. Entiende tus rachas y detecta patrones en tu juego.',
      icon: <TrendingUpIcon size={48} />,
    },
    {
      title: 'IA Deportiva',
      content: 'Usa nuestra Inteligencia Artificial para recibir feedback tactico personalizado y revivir tus Highlights mas memorables.',
      icon: <SparklesIcon size={48} />,
    }
  ];

  const historicalGuide = [
    { title: "Desglose Mensual", content: "Profundiza en tus datos. Despliega cada ano para ver tu rendimiento mes a mes.", icon: <CalendarIcon size={48} /> },
    { title: "Detalle de Partidos", content: "Al expandir un mes, veras la lista de partidos jugados con sus estadisticas individuales.", icon: <ClipboardIcon size={48} /> }
  ];

  const aiGuide = [
    { title: "Highlights", content: "La IA analiza tus partidos recientes para encontrar tus mejores actuaciones y explicarte por que fuiste clave.", icon: <SparklesIcon size={48} /> },
    { title: "Coach Virtual", content: "Recibe un consejo tactico basado en tus tendencias recientes. Descubre que estas haciendo bien y que puedes mejorar.", icon: <ChatBubbleIcon size={48} /> }
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
    } catch (err: any) {
      setHighlightsError(err.message || "Error al generar el analisis.");
    } finally {
      setIsGeneratingHighlights(false);
    }
  }, [matches, addAIInteraction, checkAILimit]);

  const handleGetCoachingInsight = useCallback(async () => {
    try {
      checkAILimit();
      setIsGeneratingInsight(true);
      setInsightError(null);
      const result = await generateCoachingInsight(matches);
      setCoachingInsight(result);
      await addAIInteraction('coach_insight', result);
    } catch (err: any) {
      setInsightError(err.message || "Error al generar la perspectiva.");
    } finally {
      setIsGeneratingInsight(false);
    }
  }, [matches, addAIInteraction, checkAILimit]);

  const aiWidget = (
    <Card title={<>{'Analisis con IA'} <SectionHelp steps={aiGuide} /></>}>
      {highlights.length === 0 && !isGeneratingHighlights && (
        <div style={{ textAlign: 'center' }}>
          <p className={s.aiDescription}>Descubre tus partidos mas determinantes.</p>
          <button
            onClick={handleAnalyzePerformance}
            className={s.aiButtonPrimary}
            disabled={matches.length < 3 || isShareMode}
          >
            <SparklesIcon /> {matches.length < 3 ? 'necesitas 3 partidos' : 'Analizar Highlights'}
          </button>
          <div className={s.aiUsageLabel}>Usos mensuales: {aiUsageCount}/{AI_MONTHLY_LIMIT}</div>
        </div>
      )}
      {isGeneratingHighlights && (
        <div className={s.aiLoadingContainer}>
          <Loader /> <p>Analizando...</p>
        </div>
      )}
      {highlightsError && <p className={s.aiErrorText}>{highlightsError}</p>}
      {highlights.length > 0 && (
        <div className={s.aiHighlightsGrid}>
          {highlights.map(h => (
            <HighlightCard key={h.matchId} highlight={h} allMatches={matches} allPlayers={allPlayers} />
          ))}
        </div>
      )}
      <div className={s.coachSection}>
        <h4 className={s.coachTitle}>
          <ChatBubbleIcon size={20} /> Perspectiva del Entrenador
        </h4>
        {coachingInsight ? (
          <div className={s.insightContainer}>
            <div>
              <h5 className={s.insightPositive}>Tendencia positiva</h5>
              <p className={s.insightText}>{coachingInsight.positiveTrend}</p>
            </div>
            <div>
              <h5 className={s.insightImprove}>Area de mejora</h5>
              <p className={s.insightText}>{coachingInsight.areaForImprovement}</p>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p className={s.coachDescription}>{'Obtene un analisis rapido de la IA.'}</p>
            <button
              onClick={handleGetCoachingInsight}
              className={s.aiButtonSecondary}
              disabled={isGeneratingInsight || matches.length < 5 || isShareMode}
            >
              {isGeneratingInsight ? <Loader /> : <SparklesIcon />}
              {matches.length < 5 ? 'necesitas 5 partidos' : 'Obtener consejo'}
            </button>
            <div className={s.aiUsageLabel}>Usos mensuales: {aiUsageCount}/{AI_MONTHLY_LIMIT}</div>
          </div>
        )}
        {isGeneratingInsight && (
          <div className={s.aiLoadingContainer}>
            <Loader /> <p>Generando...</p>
          </div>
        )}
        {insightError && <p className={s.aiErrorText}>{insightError}</p>}
      </div>
      <div className={s.consistencySection}>
        <ConsistencyWidget matches={matches} />
      </div>
    </Card>
  );

  const widgetComponents: Record<WidgetId, React.ReactNode> = {
    summary: <SummaryWidget matches={matches} />,
    contributionMetrics: <ContributionMetricsWidget matches={matches} />,
    streaks: <StreaksWidget matches={matches} />,
    calendar: <ActivityCalendar matches={matches} />,
    historical: <Card title={<>Desglose historico <SectionHelp steps={historicalGuide} /></>}><HistoricalAnalysis matches={matches} /></Card>,
    seasonalComparison: <SeasonalComparison matches={matches} />,
    momentum: <MomentumWidget matches={matches} />,
    ai: aiWidget
  };

  return (
    <>
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={(dontShowAgain) => { setIsTutorialOpen(false); if (dontShowAgain) markTutorialAsSeen(); }}
        steps={tutorialSteps}
      />
      <ShareViewModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} page="stats" />
      <main className={`${s.container} ${!isDesktop ? s.containerMobile : ''}`}>
        <div className={`${s.header} ${!isDesktop ? s.headerMobile : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <h2 className={s.pageTitle}>
              {'Estadisticas'}
              <SectionHelp steps={[
                { title: 'Estadisticas', content: 'Tu centro de mando. Aqui tienes todas las metricas que definen tu rendimiento.', icon: <BarChartIcon size={48} /> },
                { title: 'Filtros', content: 'Usa los filtros de ano dentro de cada tarjeta para ver datos especificos de una temporada.', icon: <InfoIcon size={48} /> }
              ]} />
            </h2>
            {!isShareMode && (
              <div className={s.headerButtons}>
                <button onClick={() => setIsShareModalOpen(true)} className={s.iconButton} aria-label="Compartir vista">
                  <ShareIcon size={20} />
                </button>
                <button onClick={() => setIsTutorialOpen(true)} className={s.iconButton} aria-label="Mostrar guia">
                  <InfoIcon size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className={s.contentContainer}>
          <div>
            {isDesktop ? (
              <div className={s.dashboardGrid}>
                <div className={s.column}>{widgetComponents.summary}{widgetComponents.streaks}</div>
                <div className={s.column}>{widgetComponents.contributionMetrics}{widgetComponents.seasonalComparison}{widgetComponents.momentum}</div>
                <div className={s.column}>{widgetComponents.calendar}{widgetComponents.historical}{widgetComponents.ai}</div>
              </div>
            ) : (
              <div className={s.dashboardList}>
                {WIDGET_ORDER.map(id => <div key={id}>{widgetComponents[id]}</div>)}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default StatsPage;

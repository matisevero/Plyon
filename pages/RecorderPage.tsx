
import React, { useState, useEffect, useMemo } from 'react';
import type { Match, MatchSortByType } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import MatchForm from '../components/MatchForm';
import MatchList from '../components/MatchList';
import MatchListControls from '../components/MatchListControls';
import PostMatchModal from '../components/modals/PostMatchModal';
import { parseLocalDate } from '../utils/analytics';
import { useTutorial } from '../hooks/useTutorial';
import TutorialModal from '../components/modals/TutorialModal';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { TableIcon } from '../components/icons/TableIcon';
import { InfoIcon } from '../components/icons/InfoIcon';
import ConfirmationModal from '../components/modals/ConfirmationModal';

const RecorderPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, addMatch, updateMatch, deleteMatch, playerProfile, availableTournaments, addQualifiersMatch, addWorldCupMatch, setCurrentPage } = useData();
  const { isTutorialSeen, markTutorialAsSeen } = useTutorial('recorder');
  
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [lastAddedMatch, setLastAddedMatch] = useState<Match | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(!isTutorialSeen);
  
  // Modal State
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);

  const [resultFilter, setResultFilter] = useState<'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE'>('ALL');
  const [tournamentFilter, setTournamentFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<MatchSortByType>('date_desc');

  const tutorialSteps = [
    {
        title: 'Bienvenido a REGISTRO',
        content: 'Esta es la página principal. Aquí puedes añadir nuevos partidos a tu historial con estadísticas y alineaciones.',
        icon: <ClipboardIcon size={48} />,
    },
    {
        title: 'Formulario simple',
        content: 'Usa los controles para registrar la fecha, resultado, goles y asistencias. ¡Es rápido e intuitivo!',
        icon: <ClipboardIcon size={48} />,
    },
    {
        title: 'Historial',
        content: 'Debajo del formulario, encontrarás tu historial completo. Usa los filtros para encontrar partidos específicos.',
        icon: <TableIcon size={48} />,
    }
  ];

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

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const filteredAndSortedMatches = useMemo(() => {
    let processedMatches = [...matches];
    if (resultFilter !== 'ALL') {
      processedMatches = processedMatches.filter(m => m.result === resultFilter);
    }
    if (tournamentFilter !== 'ALL') {
        if (tournamentFilter === 'NONE') {
            processedMatches = processedMatches.filter(m => !m.tournament || m.tournament === "");
        } else {
            processedMatches = processedMatches.filter(m => m.tournament === tournamentFilter);
        }
    }
    processedMatches.sort((a, b) => {
      switch (sortBy) {
        case 'goals_desc': return b.myGoals - a.myGoals;
        case 'goals_asc': return a.myGoals - b.myGoals;
        case 'assists_desc': return b.myAssists - a.myAssists;
        case 'assists_asc': return a.myAssists - b.myAssists;
        case 'date_asc': return parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime();
        case 'date_desc': default: return parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
      }
    });
    return processedMatches;
  }, [matches, resultFilter, sortBy, tournamentFilter]);

  const handleAddMatch = async (newMatchData: Omit<Match, 'id'>) => {
    try {
      setError(null);
      let newMatch: Match;
      const { activeWorldCupMode } = playerProfile;

      if (activeWorldCupMode === 'qualifiers' && addQualifiersMatch) {
          newMatch = await addQualifiersMatch(newMatchData);
      } else if (activeWorldCupMode === 'campaign' && addWorldCupMatch) {
          newMatch = await addWorldCupMatch(newMatchData);
      } else {
          newMatch = await addMatch(newMatchData);
      }
      
      setTimeout(() => {
        setLastAddedMatch(newMatch);
      }, 0);

    } catch (e) {
      console.error("Failed to add match:", e);
      const errorMessage = e instanceof Error ? e.message : "No se pudo registrar el partido.";
      setError(errorMessage);
    }
  };
  
  const handleUpdateMatch = (updatedMatch: Match) => {
    updateMatch(updatedMatch);
    setEditingMatchId(null);
  };

  const handleDeleteMatchClick = (matchId: string) => {
    setMatchToDelete(matchId);
  };

  const confirmDeleteMatch = async () => {
    if (matchToDelete) {
      await deleteMatch(matchToDelete);
      setMatchToDelete(null);
    }
  };
  
  const handleStartEdit = (matchId: string) => {
    setEditingMatchId(matchId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setEditingMatchId(null);
  };

  const handleCloseModal = () => {
    setLastAddedMatch(null);
  };

  const handleImportClick = () => {
    setCurrentPage('settings');
  };

  const commonStyles = {
    sectionTitle: {
      fontSize: theme.typography.fontSize.large,
      fontWeight: 700,
      color: theme.colors.primaryText,
      margin: 0,
      borderLeft: `4px solid ${theme.colors.accent1}`,
      paddingLeft: theme.spacing.medium,
    },
    errorText: {
      color: theme.colors.loss,
      textAlign: 'center' as const,
      backgroundColor: `${theme.colors.loss}1A`,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
    },
    controlsContainer: { marginBottom: theme.spacing.large },
    infoButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
    },
  };

  const styles: { [key: string]: React.CSSProperties } = {
    mainContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`,
      display: 'grid',
      gap: theme.spacing.extraLarge,
      gridTemplateColumns: isDesktop ? '380px 1fr' : '1fr',
    },
    formContainer: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.large,
      borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large,
      border: `1px solid ${theme.colors.border}`,
      alignSelf: 'start',
      transition: 'background-color 0.3s, border-color 0.3s',
      ...(isDesktop && {
        position: 'sticky' as 'sticky',
        top: `calc(65px + ${theme.spacing.extraLarge})`,
      }),
    },
    listContainer: {},
    ...commonStyles,
  };

  const matchToEdit = editingMatchId ? matches.find(m => m.id === editingMatchId) ?? null : null;
  const formTitle = matchToEdit ? "Editar partido" : "Registrar partido";

  return (
    <>
      <TutorialModal 
          isOpen={isTutorialOpen}
          onClose={(dontShowAgain) => {
              setIsTutorialOpen(false);
              if(dontShowAgain) markTutorialAsSeen();
          }}
          steps={tutorialSteps}
      />
      <main style={styles.mainContent}>
        <div style={styles.formContainer}>
          <div style={{display:'flex', alignItems:'center', gap: theme.spacing.small, marginBottom: theme.spacing.large}}>
            <h2 style={{...styles.sectionTitle, marginBottom: 0}}>{formTitle}</h2>
            <button onClick={() => setIsTutorialOpen(true)} style={styles.infoButton} aria-label="Mostrar guía"><InfoIcon color={theme.colors.secondaryText} /></button>
          </div>
          <MatchForm 
            onAddMatch={handleAddMatch}
            onUpdateMatch={handleUpdateMatch}
            onCancelEdit={handleCancelEdit}
            matchToEdit={matchToEdit}
            allPlayers={allPlayers}
            availableTournaments={availableTournaments}
          />
        </div>
        <div style={styles.listContainer}>
          {error && <p style={styles.errorText} role="alert">{error}</p>}
          <div style={{display:'flex', alignItems:'center', gap: theme.spacing.small, marginBottom: theme.spacing.large}}>
            <h2 style={{...styles.sectionTitle, marginBottom: 0}}>Historial de partidos</h2>
            <button onClick={() => setIsTutorialOpen(true)} style={styles.infoButton} aria-label="Mostrar guía"><InfoIcon color={theme.colors.secondaryText} /></button>
          </div>
          <div style={styles.controlsContainer}>
            <MatchListControls
              resultFilter={resultFilter}
              setResultFilter={setResultFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              isDesktop={isDesktop}
              availableTournaments={availableTournaments}
              tournamentFilter={tournamentFilter}
              setTournamentFilter={setTournamentFilter}
            />
          </div>
          <MatchList 
            matches={filteredAndSortedMatches} 
            allMatches={matches}
            allPlayers={allPlayers}
            onDeleteMatch={handleDeleteMatchClick}
            onEditMatch={handleStartEdit}
            sortBy={sortBy}
            isReadOnly={false}
            onImportClick={handleImportClick}
          />
        </div>
      </main>
      {lastAddedMatch && (
        <PostMatchModal match={lastAddedMatch} matches={matches} onClose={handleCloseModal} playerProfile={playerProfile} />
      )}
      <ConfirmationModal
        isOpen={!!matchToDelete}
        onClose={() => setMatchToDelete(null)}
        onConfirm={confirmDeleteMatch}
        title="Eliminar partido"
        message="¿Estás seguro de que quieres eliminar este partido? Esta acción no se puede deshacer y afectará a tus estadísticas."
      />
    </>
  );
};

export default RecorderPage;


import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { CloseIcon } from '../icons/CloseIcon';
import { GoalIcon } from '../icons/GoalIcon';
import { AssistIcon } from '../icons/AssistIcon';
import type { Match, PlayerPerformance } from '../../types';

interface LiveMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishMatch: (matchData: Partial<Match>) => void;
}

type MatchEvent = {
    id: string;
    minute: number;
    type: 'goal' | 'assist' | 'opponent_goal';
    playerName?: string; // Undefined for opponent goals
};

const LiveMatchModal: React.FC<LiveMatchModalProps> = ({ isOpen, onClose, onFinishMatch }) => {
  const { theme } = useTheme();
  const { playerProfile } = useData();
  
  // --- Game State ---
  const [phase, setPhase] = useState<'setup' | 'live'>('setup');
  const [myTeamName, setMyTeamName] = useState('Mi Equipo');
  const [opponentName, setOpponentName] = useState('Rival');
  
  // Setup: Players
  const [players, setPlayers] = useState<string[]>([playerProfile.name || 'Yo']);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Live: Time & Score
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  
  // Wake Lock Ref
  const wakeLockRef = useRef<any>(null);

  // --- Effects ---

  useEffect(() => {
      if (isOpen) {
          setPhase('setup');
          setSeconds(0);
          setEvents([]);
          setIsRunning(false);
          setPlayers([playerProfile.name || 'Yo']);
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'auto';
          releaseWakeLock();
      }
      return () => { 
          document.body.style.overflow = 'auto'; 
          releaseWakeLock();
      };
  }, [isOpen, playerProfile.name]);

  // Timer Logic
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      if (isRunning) {
          interval = setInterval(() => {
              setSeconds(s => s + 1);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [isRunning]);

  // Wake Lock Logic
  const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
          try {
              // @ts-ignore
              wakeLockRef.current = await navigator.wakeLock.request('screen');
          } catch (err) {
              console.log(`${err}`);
          }
      }
  };

  const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
      }
  };

  const handleStartMatch = () => {
      setPhase('live');
      setIsRunning(true);
      requestWakeLock();
  };

  const handleAddPlayer = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPlayerName.trim()) {
          setPlayers([...players, newPlayerName.trim()]);
          setNewPlayerName('');
      }
  };

  const removePlayer = (index: number) => {
      const newP = [...players];
      newP.splice(index, 1);
      setPlayers(newP);
  };

  const formatTime = (totalSeconds: number) => {
      const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const secs = (totalSeconds % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
  };

  const currentMinute = Math.floor(seconds / 60) + 1; // 0-59s is 1'

  // --- Actions ---

  const addEvent = (type: 'goal' | 'assist' | 'opponent_goal', playerName?: string) => {
      setEvents(prev => [...prev, {
          id: Date.now().toString(),
          minute: currentMinute,
          type,
          playerName
      }]);
  };

  const undoLastEvent = () => {
      setEvents(prev => prev.slice(0, -1));
  };

  const finishMatch = () => {
      setIsRunning(false);
      releaseWakeLock();

      // Process Stats
      const myGoalsCount = events.filter(e => e.type === 'goal' && e.playerName === (playerProfile.name || 'Yo')).length;
      const myAssistsCount = events.filter(e => e.type === 'assist' && e.playerName === (playerProfile.name || 'Yo')).length;
      
      const teamGoals = events.filter(e => e.type === 'goal').length;
      const opponentGoals = events.filter(e => e.type === 'opponent_goal').length;
      
      let result: 'VICTORIA' | 'DERROTA' | 'EMPATE' = 'EMPATE';
      if (teamGoals > opponentGoals) result = 'VICTORIA';
      else if (opponentGoals > teamGoals) result = 'DERROTA';

      const goalDifference = Math.abs(teamGoals - opponentGoals);

      // Generate Player Performance List
      const performanceMap: Record<string, PlayerPerformance> = {};
      players.forEach(p => {
          performanceMap[p] = { name: p, goals: 0, assists: 0 };
      });
      
      events.forEach(e => {
          if (e.playerName && performanceMap[e.playerName]) {
              if (e.type === 'goal') performanceMap[e.playerName].goals++;
              if (e.type === 'assist') performanceMap[e.playerName].assists++;
          }
      });

      // Generate Timeline Notes
      const timeline = events
          .sort((a, b) => a.minute - b.minute) // Should be sorted anyway
          .map(e => {
              if (e.type === 'opponent_goal') return `${e.minute}' ⚽️ Gol de ${opponentName}`;
              const icon = e.type === 'goal' ? '⚽️' : '👟';
              const label = e.type === 'goal' ? 'Gol' : 'Asistencia';
              return `${e.minute}' ${icon} ${label} (${e.playerName})`;
          })
          .join('\n');

      const notes = `Partido registrado en vivo.\n\nMinuto a Minuto:\n${timeline}`;

      const matchData: Partial<Match> = {
          date: new Date().toISOString().split('T')[0],
          result,
          myGoals: myGoalsCount,
          myAssists: myAssistsCount,
          goalDifference: result === 'EMPATE' ? 0 : (result === 'DERROTA' ? -goalDifference : goalDifference),
          notes,
          myTeamPlayers: Object.values(performanceMap),
          opponentPlayers: [] 
      };

      onFinishMatch(matchData);
      onClose();
  };

  // --- Rendering ---

  if (!isOpen) return null;

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#000', // Black background for battery saving (OLED)
      zIndex: 5000,
      display: 'flex', flexDirection: 'column',
      color: '#fff',
      fontFamily: theme.typography.fontFamily
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem', borderBottom: '1px solid #333'
    },
    setupContainer: {
        flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
        maxWidth: '500px', margin: '0 auto', width: '100%'
    },
    input: {
        width: '100%', padding: '1rem', borderRadius: '12px',
        backgroundColor: '#1a1a1a', border: '1px solid #333',
        color: '#fff', fontSize: '1.1rem', outline: 'none'
    },
    button: {
        padding: '1rem', borderRadius: '12px', border: 'none',
        fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
        backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent
    },
    playerChip: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#1a1a1a', padding: '0.8rem 1rem', borderRadius: '8px',
        border: '1px solid #333'
    },
    
    // Live UI
    liveContainer: {
        flex: 1, display: 'flex', flexDirection: 'column',
    },
    scoreboard: {
        padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: '2rem', borderBottom: '1px solid #333',
        background: 'linear-gradient(180deg, #111 0%, #000 100%)'
    },
    scoreBig: { fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 },
    timerDisplay: {
        fontSize: '1.5rem', fontWeight: 700, color: isRunning ? theme.colors.accent1 : '#666',
        fontVariantNumeric: 'tabular-nums'
    },
    controlBar: {
        display: 'flex', gap: '10px', padding: '1rem', justifyContent: 'center',
        borderTop: '1px solid #333'
    },
    controlBtn: {
        padding: '0.8rem 1.5rem', borderRadius: '30px', border: '1px solid #333',
        background: 'transparent', color: '#fff', fontSize: '0.9rem', cursor: 'pointer'
    },
    
    // Action Area
    grid: {
        flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '10px', padding: '10px', overflowY: 'auto'
    },
    playerCard: {
        backgroundColor: '#111', borderRadius: '12px', border: '1px solid #333',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '10px', minHeight: '120px'
    },
    playerName: { fontSize: '1rem', fontWeight: 700, marginBottom: '8px' },
    actionRow: { display: 'flex', gap: '8px', marginTop: 'auto' },
    actionBtn: {
        flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', gap: '4px'
    },
    
    opponentArea: {
        padding: '1rem', backgroundColor: '#1a0505', borderTop: '1px solid #333',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    },
    opponentBtn: {
        backgroundColor: theme.colors.loss, color: '#fff', 
        width: '50px', height: '50px', borderRadius: '50%',
        border: 'none', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    }
  };

  const homeScore = events.filter(e => e.type === 'goal').length;
  const awayScore = events.filter(e => e.type === 'opponent_goal').length;

  return createPortal(
    <div style={styles.backdrop}>
        {/* SETUP PHASE */}
        {phase === 'setup' && (
            <>
                <div style={styles.header}>
                    <h2>Configurar Partido</h2>
                    <button onClick={onClose} style={{background: 'none', border: 'none', color: '#fff'}}><CloseIcon/></button>
                </div>
                <div style={styles.setupContainer}>
                    <div style={{display:'flex', gap: '10px'}}>
                        <input style={styles.input} value={myTeamName} onChange={e => setMyTeamName(e.target.value)} placeholder="Mi Equipo" />
                        <input style={styles.input} value={opponentName} onChange={e => setOpponentName(e.target.value)} placeholder="Rival" />
                    </div>
                    
                    <div>
                        <h4 style={{margin: '0 0 10px 0', color: '#888'}}>Alineación</h4>
                        <form onSubmit={handleAddPlayer} style={{display:'flex', gap: '10px', marginBottom: '1rem'}}>
                            <input style={{...styles.input, padding: '0.8rem'}} value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Nombre jugador..." />
                            <button type="submit" style={{...styles.button, width: 'auto', padding: '0 1.5rem'}}>+</button>
                        </form>
                        <div style={{maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            {players.map((p, i) => (
                                <div key={i} style={styles.playerChip}>
                                    <span>{p}</span>
                                    {p !== playerProfile.name && (
                                        <button onClick={() => removePlayer(i)} style={{background: 'none', border: 'none', color: '#ff4444', fontSize: '1.2rem', padding: '0 10px'}}>×</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button style={{...styles.button, marginTop: 'auto'}} onClick={handleStartMatch}>
                        ⏱️ Comenzar Partido
                    </button>
                </div>
            </>
        )}

        {/* LIVE PHASE */}
        {phase === 'live' && (
            <div style={styles.liveContainer}>
                <div style={styles.scoreboard}>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '0.9rem', color: '#888'}}>{myTeamName}</div>
                        <div style={{...styles.scoreBig, color: theme.colors.accent1}}>{homeScore}</div>
                    </div>
                    <div style={{textAlign: 'center', width: '80px'}}>
                        <div style={styles.timerDisplay}>{formatTime(seconds)}</div>
                        <div style={{fontSize: '0.7rem', color: isRunning ? theme.colors.accent1 : '#666', marginTop: '4px'}}>
                            {isRunning ? 'EN VIVO' : 'PAUSA'}
                        </div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '0.9rem', color: '#888'}}>{opponentName}</div>
                        <div style={{...styles.scoreBig, color: theme.colors.loss}}>{awayScore}</div>
                    </div>
                </div>

                <div style={styles.grid}>
                    {players.map((p, i) => (
                        <div key={i} style={styles.playerCard}>
                            <div style={styles.playerName}>{p}</div>
                            <div style={styles.actionRow}>
                                <button 
                                    style={{...styles.actionBtn, backgroundColor: '#333', color: theme.colors.accent1}}
                                    onClick={() => addEvent('goal', p)}
                                >
                                    <GoalIcon size={20} /> Gol
                                </button>
                                <button 
                                    style={{...styles.actionBtn, backgroundColor: '#333', color: theme.colors.accent2}}
                                    onClick={() => addEvent('assist', p)}
                                >
                                    <AssistIcon size={20} /> Asist.
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={styles.opponentArea}>
                    <div>
                        <div style={{fontWeight: 'bold'}}>Gol Rival</div>
                        <div style={{fontSize: '0.8rem', color: '#888'}}>Suma al marcador oponente</div>
                    </div>
                    <button style={styles.opponentBtn} onClick={() => addEvent('opponent_goal')}>+</button>
                </div>

                <div style={styles.controlBar}>
                    <button style={styles.controlBtn} onClick={() => setIsRunning(!isRunning)}>
                        {isRunning ? 'Pausar' : 'Reanudar'}
                    </button>
                    <button style={styles.controlBtn} onClick={undoLastEvent} disabled={events.length === 0}>
                        Deshacer
                    </button>
                    <button 
                        style={{...styles.controlBtn, backgroundColor: theme.colors.win, color: '#000', borderColor: theme.colors.win, fontWeight: 'bold'}}
                        onClick={finishMatch}
                    >
                        Terminar
                    </button>
                </div>
            </div>
        )}
    </div>,
    document.body
  );
};

export default LiveMatchModal;

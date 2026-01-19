
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { CloseIcon } from '../icons/CloseIcon';
import { Loader } from '../Loader';
import { parseLocalDate } from '../../utils/analytics';
import { useAuth } from '../../contexts/AuthContext';
import { CheckIcon } from '../icons/CheckIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { FootballIcon } from '../icons/FootballIcon';
import { Match } from '../../types';
import EditMatchModal from './EditMatchModal'; 

interface PendingMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PendingMatchesModal: React.FC<PendingMatchesModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { pendingMatches, confirmPendingMatch } = useData();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'stack' | 'list'>('stack');
  
  // Drag State
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState<Match | null>(null);

  useEffect(() => {
      if (isOpen) {
          setViewMode('stack');
          setDragX(0);
          setIsDragging(false);
          setExitDir(null);
          setIsEditing(false);
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'auto';
      }
      return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Sync editedMatch when switching currentMatch
  useEffect(() => {
      if (pendingMatches.length > 0 && !isEditing) {
          const original = pendingMatches[0].matchData;
          // Apply initial inversion logic for display/edit
          const myView = { ...original };
          if (pendingMatches[0].role === 'opponent') {
              if (original.result === 'VICTORIA') myView.result = 'DERROTA';
              else if (original.result === 'DERROTA') myView.result = 'VICTORIA';
          }
          setEditedMatch(myView);
      }
  }, [pendingMatches, isEditing]);

  if (!isOpen) return null;

  const currentMatch = pendingMatches.length > 0 ? pendingMatches[0] : null;

  const handleAction = async (matchId: string, action: 'accept' | 'reject') => {
      setExitDir(action === 'accept' ? 'right' : 'left');
      
      // If we edited, pass the edited data. If not, pass undefined (logic handles defaults)
      // HOWEVER, since we inverted logic for editing, if we edited, we must pass it back.
      // If we didn't edit, the service handles inversion automatically.
      const finalData = (action === 'accept' && isEditing) ? editedMatch : undefined;

      setTimeout(() => {
          const match = pendingMatches.find(m => m.id === matchId);
          if (match) confirmPendingMatch(match, action, finalData as Match | undefined);
          setExitDir(null);
          setDragX(0);
          setIsEditing(false);
      }, 300);
  };

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isEditing) return; // Disable drag while editing
    setIsDragging(true);
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setStartX(x - dragX);
  };

  const onDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setDragX(x - startX);
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 130;
    if (dragX > threshold) handleAction(currentMatch!.id, 'accept');
    else if (dragX < -threshold) handleAction(currentMatch!.id, 'reject');
    else setDragX(0);
  };

  const getMyResult = () => {
      // If editing, trust the edited match state
      if (editedMatch) return editedMatch.result;
      
      // Fallback (should normally be synced)
      const senderResult = currentMatch!.matchData.result;
      if (currentMatch!.role === 'teammate') return senderResult;
      if (senderResult === 'VICTORIA') return 'DERROTA';
      if (senderResult === 'DERROTA') return 'VICTORIA';
      return 'EMPATE';
  };

  const StatStepper = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
          <div style={{fontSize: '0.8rem', color: theme.colors.secondaryText}}>{label}</div>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <button 
                  onClick={() => onChange(Math.max(0, value - 1))}
                  style={{width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${theme.colors.borderStrong}`, background: 'transparent', color: theme.colors.primaryText, cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              >
                  -
              </button>
              <span style={{fontSize: '1.5rem', fontWeight: 'bold', minWidth: '24px', textAlign: 'center'}}>{value}</span>
              <button 
                  onClick={() => onChange(value + 1)}
                  style={{width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${theme.colors.accent1}`, background: `${theme.colors.accent1}20`, color: theme.colors.accent1, cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              >
                  +
              </button>
          </div>
      </div>
  );

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.92)', zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, backdropFilter: 'blur(10px)',
    },
    modal: {
      backgroundColor: 'transparent', width: '100%', maxWidth: '420px',
      maxHeight: '95vh', display: 'flex', flexDirection: 'column', position: 'relative'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.medium },
    title: { margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' },
    stackContainer: { position: 'relative', width: '100%', height: '580px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    cardBase: {
        position: 'absolute', width: '100%', height: '460px',
        backgroundColor: theme.colors.surface, borderRadius: '32px',
        border: `1px solid ${theme.colors.borderStrong}`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: '2.5rem', display: 'flex', flexDirection: 'column',
        cursor: isDragging ? 'grabbing' : 'default',
        transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        touchAction: 'none'
    },
    ghostCard: { zIndex: 5, transform: 'scale(0.92) translateY(25px)', opacity: 0.3, pointerEvents: 'none' },
    indicator: {
        position: 'absolute', top: '40px', padding: '10px 24px',
        borderRadius: '12px', border: '5px solid', fontSize: '1.8rem',
        fontWeight: 900, textTransform: 'uppercase', zIndex: 30, opacity: 0, pointerEvents: 'none'
    },
    acceptIndicator: { right: '40px', borderColor: theme.colors.win, color: theme.colors.win, transform: 'rotate(-15deg)' },
    rejectIndicator: { left: '40px', borderColor: theme.colors.loss, color: theme.colors.loss, transform: 'rotate(15deg)' },
    senderInfo: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem' },
    senderAvatar: { width: '50px', height: '50px', borderRadius: '50%', border: `2px solid ${theme.colors.accent2}`, objectFit: 'cover' },
    senderName: { fontWeight: 800, fontSize: '1.2rem', color: theme.colors.primaryText },
    matchDate: { fontSize: '0.9rem', color: theme.colors.secondaryText },
    resultDisplay: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px' },
    resultLabel: { fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 },
    resultValue: { fontSize: '4rem', fontWeight: 900, lineHeight: 1, cursor: isEditing ? 'pointer' : 'default' },
    statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem', padding: '1.2rem', backgroundColor: theme.colors.background, borderRadius: '24px' },
    controls: { display: 'flex', gap: '3rem', justifyContent: 'center', marginTop: '2rem' },
    actionBtn: { width: '80px', height: '80px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 15px 30px rgba(0,0,0,0.4)', transition: 'transform 0.2s' },
    editButton: {
        position: 'absolute', top: '20px', right: '20px',
        background: isEditing ? theme.colors.accent1 : 'transparent',
        color: isEditing ? theme.colors.textOnAccent : theme.colors.secondaryText,
        border: `1px solid ${isEditing ? theme.colors.accent1 : theme.colors.borderStrong}`,
        borderRadius: '20px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
    }
  };

  const getActiveCardStyle = (): React.CSSProperties => {
      let transform = `translateX(${dragX}px) rotate(${dragX * 0.06}deg)`;
      let opacity = 1;
      if (exitDir === 'right') { transform = `translateX(800px) rotate(60deg)`; opacity = 0; }
      else if (exitDir === 'left') { transform = `translateX(-800px) rotate(-60deg)`; opacity = 0; }
      return { ...styles.cardBase, transform, opacity, zIndex: 10 };
  };

  const toggleResult = () => {
      if (!isEditing || !editedMatch) return;
      const results: ('VICTORIA' | 'EMPATE' | 'DERROTA')[] = ['VICTORIA', 'EMPATE', 'DERROTA'];
      const nextIndex = (results.indexOf(editedMatch.result) + 1) % 3;
      setEditedMatch({ ...editedMatch, result: results[nextIndex] });
  };

  return createPortal(
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <header style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FootballIcon size={28} color={theme.colors.accent1} />
                <h3 style={styles.title}>Validación</h3>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: '#fff', display: 'flex' }}><CloseIcon size={24}/></button>
        </header>

        {pendingMatches.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '6rem', marginBottom: '1.5rem' }}>⚽️</div>
                <h2>¡Estás al día!</h2>
                <button onClick={onClose} style={{ marginTop: '3rem', padding: '16px 32px', borderRadius: '16px', border: 'none', backgroundColor: theme.colors.accent2, color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Volver al inicio</button>
            </div>
        ) : (
            viewMode === 'stack' ? (
                <div style={styles.stackContainer}>
                    <div style={{ ...styles.indicator, ...styles.acceptIndicator, opacity: Math.max(0, Math.min(1, (dragX - 40) / 100)) }}>ACEPTAR</div>
                    <div style={{ ...styles.indicator, ...styles.rejectIndicator, opacity: Math.max(0, Math.min(1, (-dragX - 40) / 100)) }}>RECHAZAR</div>
                    {pendingMatches[1] && <div style={{ ...styles.cardBase, ...styles.ghostCard }}></div>}
                    
                    <div style={getActiveCardStyle()} onMouseDown={onDragStart} onTouchStart={onDragStart} onMouseMove={onDragMove} onTouchMove={onDragMove} onMouseUp={onDragEnd} onMouseLeave={onDragEnd} onTouchEnd={onDragEnd} >
                        <button 
                            style={styles.editButton} 
                            onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
                            title="Corregir datos antes de aceptar"
                        >
                            {isEditing ? 'Guardar Cambios' : 'Corregir'}
                        </button>

                        <div style={styles.senderInfo}>
                            <img src={`https://ui-avatars.com/api/?name=${currentMatch!.fromUserName}&background=random`} style={styles.senderAvatar} alt="" />
                            <div>
                                <div style={styles.senderName}>{currentMatch!.fromUserName}</div>
                                <div style={styles.matchDate}>{parseLocalDate(currentMatch!.matchData.date).toLocaleDateString()}</div>
                            </div>
                        </div>
                        
                        <div style={styles.resultDisplay}>
                            <span style={styles.resultLabel}>
                                {isEditing ? 'Toca para cambiar resultado' : 'Tu resultado'}
                            </span>
                            <span 
                                style={{ 
                                    ...styles.resultValue, 
                                    color: getMyResult() === 'VICTORIA' ? theme.colors.win : getMyResult() === 'DERROTA' ? theme.colors.loss : theme.colors.draw,
                                    textDecoration: isEditing ? 'underline' : 'none',
                                    textDecorationStyle: 'dotted'
                                }}
                                onClick={toggleResult}
                            >
                                {getMyResult()}
                            </span>
                        </div>

                        {isEditing && editedMatch ? (
                            <div style={styles.statsGrid}>
                                <StatStepper 
                                    label="Goles" 
                                    value={editedMatch.myGoals} 
                                    onChange={(val) => setEditedMatch({...editedMatch, myGoals: val})} 
                                />
                                <StatStepper 
                                    label="Asistencias" 
                                    value={editedMatch.myAssists} 
                                    onChange={(val) => setEditedMatch({...editedMatch, myAssists: val})} 
                                />
                            </div>
                        ) : (
                            <div style={styles.statsGrid}>
                                <div style={{ textAlign: 'center' }}><span>⚽️ {editedMatch?.myGoals ?? currentMatch!.matchData.myGoals} Goles</span></div>
                                <div style={{ textAlign: 'center' }}><span>👟 {editedMatch?.myAssists ?? currentMatch!.matchData.myAssists} Asist.</span></div>
                            </div>
                        )}
                        
                        {isEditing && (
                            <div style={{textAlign: 'center', fontSize: '0.8rem', color: theme.colors.secondaryText, marginTop: '1rem', fontStyle: 'italic'}}>
                                * Estás editando tu copia personal del partido.
                            </div>
                        )}
                    </div>

                    <div style={styles.controls}>
                        <button style={{ ...styles.actionBtn, backgroundColor: theme.colors.loss }} onClick={() => handleAction(currentMatch!.id, 'reject')}><TrashIcon size={36} color="#fff" /></button>
                        <button style={{ ...styles.actionBtn, backgroundColor: theme.colors.win }} onClick={() => handleAction(currentMatch!.id, 'accept')}><CheckIcon size={40} color="#fff" /></button>
                    </div>
                    
                    {!isEditing && (
                        <button style={{ background: 'none', border: 'none', color: theme.colors.accent2, cursor: 'pointer', marginTop: '2rem', fontWeight: 'bold' }} onClick={() => setViewMode('list')}>
                            Ver lista completa
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ padding: '1rem', backgroundColor: theme.colors.surface, borderRadius: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {pendingMatches.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderBottom: `1px solid ${theme.colors.border}` }}>
                            <div style={{ flex: 1, color: theme.colors.primaryText }}>{m.fromUserName}</div>
                            <button onClick={() => handleAction(m.id, 'accept')} style={{ color: theme.colors.win, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✓</button>
                            <button onClick={() => handleAction(m.id, 'reject')} style={{ color: theme.colors.loss, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
                        </div>
                    ))}
                    <button onClick={() => setViewMode('stack')} style={{ width: '100%', padding: '1rem', color: theme.colors.accent2, background: 'none', border: 'none', cursor: 'pointer' }}>Volver a tarjetas</button>
                </div>
            )
        )}
      </div>
    </div>,
    document.body
  );
};

export default PendingMatchesModal;

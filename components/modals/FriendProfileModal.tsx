
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getMatchesForUser, blockUser } from '../../services/firebaseService';
import type { PublicProfile, Match } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import { Loader } from '../Loader';
import { FootballIcon } from '../icons/FootballIcon';
import StatCard from '../StatCard';
import RecentForm from '../RecentForm';
import { parseLocalDate } from '../../utils/analytics';
import ReportUserModal from './ReportUserModal';
import { ThreeDotsIcon } from '../icons/ThreeDotsIcon';

interface FriendProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: PublicProfile;
}

const FriendProfileModal: React.FC<FriendProfileModalProps> = ({ isOpen, onClose, friend }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && friend.uid) {
      setLoading(true);
      getMatchesForUser(friend.uid)
        .then(fetchedMatches => {
            setMatches(fetchedMatches.sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()));
        })
        .finally(() => setLoading(false));
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, friend]);

  const stats = useMemo(() => {
      const wins = matches.filter(m => m.result === 'VICTORIA').length;
      const draws = matches.filter(m => m.result === 'EMPATE').length;
      const losses = matches.filter(m => m.result === 'DERROTA').length;
      const totalPoints = wins * 3 + draws;
      const goals = matches.reduce((sum, m) => sum + m.myGoals, 0);
      const assists = matches.reduce((sum, m) => sum + m.myAssists, 0);
      return { wins, draws, losses, totalPoints, goals, assists, matchesPlayed: matches.length };
  }, [matches]);

  const handleBlockUser = async () => {
      if (!user || !confirm(`¿Estás seguro de que quieres bloquear a ${friend.name}? No podrá ver tu perfil ni enviarte mensajes.`)) return;
      try {
          await blockUser(user.uid, friend.uid);
          onClose(); // Close modal immediately
          alert(`${friend.name} ha sido bloqueado.`);
      } catch (e) {
          console.error(e);
          alert("Error al bloquear usuario.");
      }
  };

  if (!isOpen) return null;

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '500px',
      maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
      animation: 'scaleUp 0.3s ease', border: `1px solid ${theme.colors.border}`,
      position: 'relative'
    },
    header: {
        position: 'relative',
        padding: theme.spacing.extraLarge,
        background: `linear-gradient(135deg, ${theme.colors.accent2}20, ${theme.colors.surface})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderBottom: `1px solid ${theme.colors.border}`,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute', top: theme.spacing.medium, right: theme.spacing.medium,
        background: 'none', border: 'none', cursor: 'pointer'
    },
    menuButton: {
        position: 'absolute', top: theme.spacing.medium, left: theme.spacing.medium,
        background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondaryText
    },
    avatar: {
        width: '100px', height: '100px', borderRadius: '50%',
        objectFit: 'cover', border: `4px solid ${theme.colors.surface}`,
        boxShadow: theme.shadows.medium, marginBottom: theme.spacing.medium
    },
    name: { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: theme.colors.primaryText },
    team: { margin: '5px 0 0 0', color: theme.colors.secondaryText, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' },
    content: { padding: theme.spacing.large, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    sectionTitle: { fontSize: '1rem', fontWeight: 600, color: theme.colors.primaryText, marginBottom: theme.spacing.medium },
    statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium },
    empty: { textAlign: 'center', padding: '2rem', color: theme.colors.secondaryText, fontStyle: 'italic' },
    matchList: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    matchItem: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: theme.spacing.medium, backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.borderStrong}`
    },
    dropdownMenu: {
        position: 'absolute', top: '40px', left: '10px',
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.medium,
        boxShadow: theme.shadows.medium,
        zIndex: 10, overflow: 'hidden', minWidth: '150px'
    },
    menuItem: {
        padding: '12px 16px', cursor: 'pointer', fontSize: '0.9rem',
        color: theme.colors.primaryText, display: 'block', width: '100%',
        textAlign: 'left', border: 'none', background: 'transparent'
    }
  };

  return (
    createPortal(
        <>
            <div style={styles.backdrop} onClick={onClose}>
                <style>{`@keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }`}</style>
                <div style={styles.modal} onClick={e => e.stopPropagation()}>
                    <div style={styles.header}>
                        <button style={styles.closeButton} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
                        
                        {/* Options Menu */}
                        <div style={{position: 'absolute', top: 16, left: 16}}>
                            <button style={styles.menuButton} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                <ThreeDotsIcon size={24} />
                            </button>
                            {isMenuOpen && (
                                <div style={styles.dropdownMenu} onMouseLeave={() => setIsMenuOpen(false)}>
                                    <button 
                                        style={{...styles.menuItem, color: theme.colors.loss}} 
                                        onClick={() => { setIsReportModalOpen(true); setIsMenuOpen(false); }}
                                    >
                                        Reportar Usuario
                                    </button>
                                    <button 
                                        style={{...styles.menuItem, color: theme.colors.loss}} 
                                        onClick={handleBlockUser}
                                    >
                                        Bloquear Usuario
                                    </button>
                                </div>
                            )}
                        </div>

                        <img src={friend.photo || `https://ui-avatars.com/api/?name=${friend.name}&background=random`} alt={friend.name} style={styles.avatar} />
                        <h2 style={styles.name}>{friend.name}</h2>
                        {friend.favoriteTeam && (
                            <p style={styles.team}><FootballIcon size={14} color={theme.colors.secondaryText} /> {friend.favoriteTeam}</p>
                        )}
                    </div>
                    <div style={styles.content}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader /></div>
                        ) : matches.length > 0 ? (
                            <>
                                <div>
                                    <h3 style={styles.sectionTitle}>Resumen General</h3>
                                    <div style={styles.statsGrid}>
                                        <StatCard label="Puntos" value={stats.totalPoints} />
                                        <StatCard label="PJ" value={stats.matchesPlayed} />
                                        <StatCard label="Goles" value={stats.goals} />
                                        <StatCard label="Asistencias" value={stats.assists} />
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 style={styles.sectionTitle}>Forma Reciente</h3>
                                    <RecentForm matches={matches} />
                                </div>

                                <div>
                                    <h3 style={styles.sectionTitle}>Últimos Partidos</h3>
                                    <div style={styles.matchList}>
                                        {matches.slice(0, 5).map(match => (
                                            <div key={match.id} style={styles.matchItem}>
                                                <span style={{fontSize: '0.8rem', color: theme.colors.secondaryText}}>
                                                    {parseLocalDate(match.date).toLocaleDateString()}
                                                </span>
                                                <div style={{display: 'flex', gap: '10px', fontWeight: 'bold'}}>
                                                    <span style={{color: match.result === 'VICTORIA' ? theme.colors.win : match.result === 'DERROTA' ? theme.colors.loss : theme.colors.draw}}>
                                                        {match.result.charAt(0)}
                                                    </span>
                                                    <span style={{color: theme.colors.primaryText}}>
                                                        ⚽️ {match.myGoals}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={styles.empty}>
                                Este jugador aún no ha registrado partidos públicos.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <ReportUserModal 
                isOpen={isReportModalOpen} 
                onClose={() => setIsReportModalOpen(false)} 
                reportedUserId={friend.uid} 
                reportedUserName={friend.name}
            />
        </>,
        document.body
    )
  );
};

export default FriendProfileModal;

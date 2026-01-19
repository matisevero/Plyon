
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Loader } from '../Loader';
import { FootballIcon } from '../icons/FootballIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { checkUsernameAvailability, claimUsername } from '../../services/firebaseService';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, onClose, onComplete }) => {
  const { theme } = useTheme();
  const { updatePlayerProfile, completeOnboarding } = useData();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with Auth if available
  useEffect(() => {
      if (isOpen && user?.displayName) {
          setName(prev => prev || user.displayName || '');
      }
  }, [isOpen, user]);

  // Auto-generate username from name if empty
  useEffect(() => {
      if (name && !username) {
          const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const randomSuffix = Math.floor(Math.random() * 1000);
          if (cleanName.length > 0) {
              setUsername(`${cleanName}${randomSuffix}`);
          }
      }
  }, [name]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !username.trim()) return;
      
      setIsLoading(true);
      setError(null);

      try {
          // If connected, claim username
          if (user) {
              const isAvailable = await checkUsernameAvailability(username.trim());
              if (!isAvailable) {
                  // Auto-recover with random suffix
                  const newSuffix = Math.floor(Math.random() * 10000);
                  const recoveryUsername = `${username.trim()}${newSuffix}`;
                  await claimUsername(user.uid, recoveryUsername);
                  setUsername(recoveryUsername); 
              } else {
                  await claimUsername(user.uid, username.trim());
              }
          }

          // Complete Profile locally & fire onboarding event
          await completeOnboarding(name.trim(), 'fresh');
          await updatePlayerProfile({ username: username.trim() });
          
          onComplete(); // Triggers the match save in parent
      } catch (err: any) {
          console.error(err);
          setError("Hubo un problema al guardar tu perfil. Intenta de nuevo.");
      } finally {
          setIsLoading(false);
      }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '400px',
      display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      border: `2px solid ${theme.colors.accent1}`,
      padding: theme.spacing.extraLarge,
      textAlign: 'center',
      position: 'relative',
    },
    iconContainer: {
        width: '64px', height: '64px', borderRadius: '50%',
        backgroundColor: `${theme.colors.accent1}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem auto', color: theme.colors.accent1,
    },
    title: { margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 900, color: theme.colors.primaryText },
    subtitle: { fontSize: '1rem', color: theme.colors.secondaryText, marginBottom: '2rem', lineHeight: 1.5 },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.medium },
    fieldGroup: { textAlign: 'left' },
    label: { fontSize: '0.85rem', fontWeight: 600, color: theme.colors.secondaryText, marginBottom: '4px', display: 'block' },
    input: {
        width: '100%', padding: '12px', borderRadius: theme.borderRadius.medium,
        backgroundColor: theme.colors.background, color: theme.colors.primaryText,
        border: `1px solid ${theme.colors.borderStrong}`, fontSize: '1rem',
        outline: 'none', boxSizing: 'border-box'
    },
    button: {
      padding: '1rem', borderRadius: theme.borderRadius.medium, fontSize: '1.1rem',
      fontWeight: 'bold', cursor: 'pointer', border: 'none', width: '100%',
      backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent,
      transition: 'transform 0.1s',
      boxShadow: theme.shadows.medium,
      marginTop: '1rem'
    },
    error: { color: theme.colors.loss, fontSize: '0.85rem', marginTop: '0.5rem' },
    closeButton: {
        position: 'absolute', top: '1rem', right: '1rem',
        background: 'none', border: 'none', cursor: 'pointer',
        color: theme.colors.secondaryText
    }
  };

  return createPortal(
    <div style={styles.backdrop}>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}><CloseIcon /></button>
        <div style={styles.iconContainer}><FootballIcon size={32} /></div>
        <h2 style={styles.title}>¡Casi listo!</h2>
        <p style={styles.subtitle}>
            Antes de guardar tu primer partido, dinos cómo quieres aparecer en tus estadísticas.
        </p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
                <label style={styles.label}>Nombre de Jugador</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Ej: Leo Messi" 
                    style={styles.input} 
                    required 
                    autoFocus
                />
            </div>
            
            <div style={styles.fieldGroup}>
                <label style={styles.label}>Tu @usuario único</label>
                <input 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                    placeholder="Ej: leomessi10" 
                    style={styles.input} 
                    required 
                />
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" style={styles.button} disabled={isLoading}>
                {isLoading ? <Loader /> : 'Guardar y Continuar'}
            </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ProfileSetupModal;

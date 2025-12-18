
import React from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { CloseIcon } from '../icons/CloseIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { UserIcon } from '../icons/UserIcon';

interface AuthIncentiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviterName?: string;
  onLogin: () => void;
}

const AuthIncentiveModal: React.FC<AuthIncentiveModalProps> = ({ isOpen, onClose, inviterName, onLogin }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '450px',
      display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s ease',
      border: `2px solid ${theme.colors.accent2}`,
      padding: theme.spacing.extraLarge,
      textAlign: 'center',
      position: 'relative',
    },
    closeButton: {
        position: 'absolute', top: theme.spacing.medium, right: theme.spacing.medium,
        background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5
    },
    iconContainer: {
        width: '64px', height: '64px', borderRadius: '50%',
        backgroundColor: `${theme.colors.accent2}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem auto', color: theme.colors.accent2
    },
    title: { margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 900, color: theme.colors.primaryText },
    description: { color: theme.colors.secondaryText, fontSize: '1rem', lineHeight: 1.6, margin: `0 0 2rem 0` },
    highlight: { color: theme.colors.accent2, fontWeight: 700 },
    buttonContainer: { display: 'flex', flexDirection: 'column', gap: theme.spacing.medium },
    primaryButton: {
      padding: '1rem', borderRadius: theme.borderRadius.medium, fontSize: '1.1rem',
      fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '0.75rem', border: 'none',
      backgroundColor: theme.colors.accent2, color: theme.colors.textOnAccent,
      transition: 'filter 0.2s',
    },
    secondaryButton: {
        background: 'none', border: 'none', color: theme.colors.secondaryText,
        fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline'
    }
  };

  const modalJSX = (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <button style={styles.closeButton} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
        <div style={styles.iconContainer}><UsersIcon size={32} /></div>
        <h2 style={styles.title}>¡Únete a la Comunidad!</h2>
        <p style={styles.description}>
            Para conectar con <span style={styles.highlight}>{inviterName || 'tu amigo'}</span>, chatear, comparar estadísticas y usar todas las funciones de Plyon, <span style={styles.highlight}>necesitas registrarte</span>.
        </p>
        <div style={styles.buttonContainer}>
          <button style={styles.primaryButton} onClick={onLogin}>
            <UserIcon size={20} /> Crear mi cuenta ahora
          </button>
          <button style={styles.secondaryButton} onClick={onClose}>Continuar como invitado (limitado)</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
};

export default AuthIncentiveModal;


import React from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { FootballIcon } from '../icons/FootballIcon';
import { UsersIcon } from '../icons/UsersIcon';

interface InvitationLandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviterName: string;
  onAccept: () => void;
}

const InvitationLandingModal: React.FC<InvitationLandingModalProps> = ({ isOpen, onClose, inviterName, onAccept }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.5s ease',
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
        width: '80px', height: '80px', borderRadius: '50%',
        backgroundColor: `${theme.colors.accent1}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem auto', color: theme.colors.accent1,
        border: `2px solid ${theme.colors.accent1}`
    },
    title: { margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 900, color: theme.colors.primaryText },
    subtitle: { fontSize: '1.1rem', color: theme.colors.secondaryText, marginBottom: '2rem' },
    highlight: { color: theme.colors.accent1, fontWeight: 800 },
    button: {
      padding: '1rem', borderRadius: theme.borderRadius.medium, fontSize: '1.1rem',
      fontWeight: 'bold', cursor: 'pointer', border: 'none', width: '100%',
      backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent,
      transition: 'transform 0.1s',
      boxShadow: theme.shadows.medium,
    },
    decoration: {
        position: 'absolute', top: 10, left: 10, opacity: 0.1
    },
    closeButton: {
      position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', 
      color: theme.colors.secondaryText, cursor: 'pointer', fontSize: '1.5rem'
    }
  };

  const modalJSX = (
    <div style={styles.backdrop}>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>×</button>
        <div style={styles.decoration}><FootballIcon size={40} /></div>
        <div style={styles.iconContainer}><UsersIcon size={40} /></div>
        <h2 style={styles.title}>¡Has sido desafiado!</h2>
        <p style={styles.subtitle}>
            <span style={styles.highlight}>{inviterName}</span> te ha invitado a unirte a su red en Plyon.
        </p>
        <button style={styles.button} onClick={onAccept}>
            Aceptar desafío y registrarme
        </button>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
};

export default InvitationLandingModal;

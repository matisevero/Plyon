
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { CloseIcon } from '../icons/CloseIcon';
import { ClipboardIcon } from '../icons/ClipboardIcon';
import { ShareIcon } from '../icons/ShareIcon';

interface ShareInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteLink: string;
  userName: string;
}

const ShareInvitationModal: React.FC<ShareInvitationModalProps> = ({ isOpen, onClose, inviteLink, userName }) => {
  const { theme } = useTheme();
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  // Pre-filled messages
  const messageText = `¡Únete a mi red en Plyon! Compara estadísticas y desafíame.`;
  
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(messageText + ' ' + inviteLink)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(messageText)}&url=${encodeURIComponent(inviteLink)}`,
    email: `mailto:?subject=${encodeURIComponent('Invitación a Plyon')}&body=${encodeURIComponent(messageText + '\n\n' + inviteLink)}`
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '400px',
      display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s ease',
      border: `1px solid ${theme.colors.border}`,
      position: 'relative',
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    content: {
      padding: theme.spacing.large,
      display: 'flex', flexDirection: 'column',
      gap: theme.spacing.large,
    },
    urlContainer: {
        display: 'flex',
        gap: theme.spacing.small,
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: '4px',
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.borderStrong}`,
    },
    urlInput: {
        flex: 1,
        padding: theme.spacing.medium,
        backgroundColor: 'transparent',
        border: 'none',
        color: theme.colors.secondaryText,
        fontSize: theme.typography.fontSize.small,
        outline: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    copyButton: {
        padding: '0 1rem',
        height: '40px',
        backgroundColor: copyStatus === 'copied' ? theme.colors.win : theme.colors.accent2,
        color: theme.colors.textOnAccent,
        border: 'none',
        borderRadius: theme.borderRadius.small,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '0.8rem',
        transition: 'background-color 0.2s',
        minWidth: '80px',
    },
    socialGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: theme.spacing.medium,
    },
    socialButton: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.small,
        padding: theme.spacing.medium,
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.medium,
        color: theme.colors.primaryText,
        textDecoration: 'none',
        fontSize: '0.8rem',
        fontWeight: 600,
        transition: 'transform 0.1s, background-color 0.2s',
        cursor: 'pointer',
    },
    helperText: {
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.secondaryText,
        textAlign: 'center',
        margin: 0,
    }
  };

  const modalJSX = (
    <div style={styles.backdrop} onClick={onClose}>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
            <h3 style={styles.title}>Invitar amigo</h3>
            <button onClick={onClose} style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>
                <CloseIcon color={theme.colors.primaryText} />
            </button>
        </div>
        
        <div style={styles.content}>
            <p style={styles.helperText}>Comparte este enlace para que tus amigos conecten contigo automáticamente.</p>
            
            {/* Manual Copy Section */}
            <div style={styles.urlContainer}>
                <input 
                    type="text" 
                    value={inviteLink} 
                    readOnly 
                    style={styles.urlInput}
                    onClick={(e) => e.currentTarget.select()}
                />
                <button onClick={handleCopy} style={styles.copyButton}>
                    {copyStatus === 'copied' ? '¡Copiado!' : 'Copiar'}
                </button>
            </div>

            {/* Social Buttons */}
            <div style={styles.socialGrid}>
                <a href={shareUrls.whatsapp} target="_blank" rel="noopener noreferrer" style={styles.socialButton}>
                    <span style={{fontSize: '1.5rem'}}>💬</span>
                    WhatsApp
                </a>
                <a href={shareUrls.twitter} target="_blank" rel="noopener noreferrer" style={styles.socialButton}>
                    <span style={{fontSize: '1.5rem'}}>✖️</span>
                    X / Twitter
                </a>
                <a href={shareUrls.email} style={styles.socialButton}>
                    <span style={{fontSize: '1.5rem'}}>✉️</span>
                    Email
                </a>
            </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
};

export default ShareInvitationModal;

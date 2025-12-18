import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { CloseIcon } from '../icons/CloseIcon';
import { Loader } from '../Loader';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { 
        document.body.style.overflow = 'auto';
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };
  
  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
        backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
        boxShadow: theme.shadows.large, width: '100%', maxWidth: '400px',
        display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s ease',
        border: `1px solid ${theme.colors.border}`,
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${theme.spacing.medium} ${theme.spacing.large}`,
        borderBottom: `1px solid ${theme.colors.border}`,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    content: {
        padding: theme.spacing.large,
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.secondaryText,
        lineHeight: 1.6,
    },
    footer: {
        display: 'flex', gap: theme.spacing.medium,
        padding: `0 ${theme.spacing.large} ${theme.spacing.large}`,
    },
    button: {
        flex: 1, padding: `${theme.spacing.medium} ${theme.spacing.large}`,
        borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium,
        fontWeight: 'bold', cursor: 'pointer',
        transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
        minHeight: '48px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
  };

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }
      `}</style>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <header style={styles.header}>
            <h2 style={styles.title}>{title}</h2>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          <div style={styles.content}>
            {message}
          </div>
          <footer style={styles.footer}>
            <button
                style={{...styles.button, backgroundColor: 'transparent', border: `1px solid ${theme.colors.borderStrong}`, color: theme.colors.secondaryText}}
                onClick={onClose}
                disabled={isLoading}
            >
                Cancelar
            </button>
            <button
                style={{...styles.button, backgroundColor: theme.colors.loss, border: `1px solid ${theme.colors.loss}`, color: theme.colors.textOnAccent}}
                onClick={handleConfirm}
                disabled={isLoading}
            >
                {isLoading ? <Loader /> : 'Confirmar'}
            </button>
          </footer>
        </div>
      </div>
    </>
  );
  
  return createPortal(modalJSX, document.body);
};

export default ConfirmationModal;
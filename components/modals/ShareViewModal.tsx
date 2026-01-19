
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { CloseIcon } from '../icons/CloseIcon';
import { LinkIcon } from '../icons/LinkIcon';
import { Loader } from '../Loader';
import { ShareIcon } from '../icons/ShareIcon';
import { ClipboardIcon } from '../icons/ClipboardIcon';

interface ShareViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: string;
  filters?: Record<string, any>;
}

const ShareViewModal: React.FC<ShareViewModalProps> = ({ isOpen, onClose, page, filters }) => {
  const { theme } = useTheme();
  const { generateShareLink } = useData();
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'copied' | 'error'>('idle');
  const [shareUrl, setShareUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const handleGenerateLink = async () => {
    setStatus('generating');
    setErrorMessage('');
    try {
      const urlString = await generateShareLink(page, filters);
      setShareUrl(urlString);
      setStatus('ready');
      
      // Intentar copiar automáticamente (funciona en Chrome, falla silenciosamente en Safari)
      try {
          await navigator.clipboard.writeText(urlString);
          setStatus('copied');
      } catch (e) {
          // Si falla el auto-copy (Safari), nos quedamos en estado 'ready' para que el usuario copie manual
          console.log("Auto-copy blocked, waiting for user interaction");
      }
    } catch (err: any) {
      console.error('Failed to create shareable link:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Error al generar el enlace.');
    }
  };

  const handleManualCopy = () => {
      if (shareUrl) {
          navigator.clipboard.writeText(shareUrl).then(() => {
              setStatus('copied');
              setTimeout(() => setStatus('ready'), 2000); // Reset to ready after 2s
          }).catch(err => {
              console.error("Manual copy failed", err);
              alert("No se pudo copiar al portapapeles. Por favor selecciona el texto y cópialo manualmente.");
          });
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
      padding: theme.spacing.large, display: 'flex', flexDirection: 'column',
      gap: theme.spacing.medium, textAlign: 'center',
    },
    description: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, lineHeight: 1.6, margin: 0 },
    button: {
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium,
      fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: theme.spacing.medium,
      transition: 'background-color 0.2s, color 0.2s, border 0.2s',
      backgroundColor: isHovered ? theme.colors.accent1 : 'transparent',
      color: isHovered ? theme.colors.textOnAccent : theme.colors.accent1,
      border: `1px solid ${theme.colors.accent1}`,
      width: '100%',
    },
    urlContainer: {
        display: 'flex',
        gap: theme.spacing.small,
        marginTop: theme.spacing.small,
        alignItems: 'center',
    },
    urlInput: {
        flex: 1,
        padding: theme.spacing.medium,
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.borderRadius.medium,
        color: theme.colors.secondaryText,
        fontSize: theme.typography.fontSize.small,
        outline: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    iconButton: {
        padding: theme.spacing.medium,
        backgroundColor: theme.colors.accent2,
        color: theme.colors.textOnAccent,
        border: 'none',
        borderRadius: theme.borderRadius.medium,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
    },
    copiedMessage: { color: theme.colors.win, fontWeight: 600, fontSize: theme.typography.fontSize.small, marginTop: theme.spacing.small }
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
            <h2 style={styles.title}>Compartir Vista</h2>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          <div style={styles.content}>
            <LinkIcon size={48} color={theme.colors.accent1} style={{ margin: '0 auto' }} />
            <p style={styles.description}>
              Genera un enlace único de solo lectura para compartir tus estadísticas actuales.
            </p>
            
            {status === 'idle' || status === 'generating' || status === 'error' ? (
                <>
                    <button 
                        style={styles.button} 
                        onClick={handleGenerateLink} 
                        disabled={status === 'generating'}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {status === 'generating' ? <Loader /> : <ShareIcon />}
                        {status === 'generating' ? 'Generando...' : 'Generar Enlace'}
                    </button>
                    {status === 'error' && <p style={{ ...styles.copiedMessage, color: theme.colors.loss }}>{errorMessage || 'Error al generar el enlace. Intenta de nuevo.'}</p>}
                </>
            ) : (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <p style={{fontSize: '0.9rem', color: theme.colors.primaryText, marginBottom: '0.5rem', textAlign: 'left'}}>Enlace generado:</p>
                    <div style={styles.urlContainer}>
                        <input 
                            type="text" 
                            value={shareUrl} 
                            readOnly 
                            style={styles.urlInput} 
                            onClick={(e) => e.currentTarget.select()}
                        />
                        <button style={styles.iconButton} onClick={handleManualCopy} title="Copiar">
                            <ClipboardIcon size={20} color="white" />
                        </button>
                    </div>
                    {status === 'copied' && <p style={styles.copiedMessage}>¡Enlace copiado al portapapeles!</p>}
                    <button 
                        style={{...styles.button, marginTop: '1.5rem', border: `1px solid ${theme.colors.borderStrong}`, color: theme.colors.secondaryText, backgroundColor: 'transparent'}}
                        onClick={onClose}
                        onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = theme.colors.background}}
                        onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'transparent'}}
                    >
                        Cerrar
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};

export default ShareViewModal;


import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import type { Match } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import { Loader } from '../Loader';
import { ShareIcon } from '../icons/ShareIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { ClipboardIcon } from '../icons/ClipboardIcon';
import { parseLocalDate } from '../../utils/analytics';
import MatchCard from '../MatchCard';

interface ShareMatchOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  allMatches: Match[];
}

const ShareMatchOptionsModal: React.FC<ShareMatchOptionsModalProps> = ({ isOpen, onClose, match, allMatches }) => {
  const { theme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const handleImageAction = async (action: 'download' | 'share') => {
      if (!cardRef.current) return;
      setIsGenerating(true);
      setError(null);
      try {
          const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
          if (action === 'download') {
              const link = document.createElement('a');
              link.download = `partido-${match.date}.png`;
              link.href = dataUrl;
              link.click();
          } else {
              const blob = await (await fetch(dataUrl)).blob();
              const file = new File([blob], `partido-${match.date}.png`, { type: 'image/png' });
              if (navigator.share && navigator.canShare({ files: [file] })) {
                  await navigator.share({ files: [file], title: 'Resumen del partido' });
              } else {
                  setError('Tu navegador no soporta compartir imágenes directamente.');
              }
          }
      } catch (err) {
          console.error(err);
          setError('Error al generar la imagen.');
      } finally {
          setIsGenerating(false);
      }
  };

  const getCopyText = () => {
    const matchYear = parseLocalDate(match.date).getFullYear();
    const yearlyMatches = allMatches.filter(m => parseLocalDate(m.date).getFullYear() === matchYear);
    
    const yearlyWins = yearlyMatches.filter(m => m.result === 'VICTORIA').length;
    const yearlyDraws = yearlyMatches.filter(m => m.result === 'EMPATE').length;
    const yearlyLosses = yearlyMatches.length - yearlyWins - yearlyDraws;
    const yearlyGoals = yearlyMatches.reduce((sum, m) => sum + m.myGoals, 0);
    const yearlyAssists = yearlyMatches.reduce((sum, m) => sum + m.myAssists, 0);

    const resultIcons = { VICTORIA: '✅', EMPATE: '🟰', DERROTA: '❌' };
    const resultTextMap = { VICTORIA: 'ganado', DERROTA: 'perdido', EMPATE: 'empatado' };

    return `Partido ${resultTextMap[match.result]} ${resultIcons[match.result]}
Fecha: ${parseLocalDate(match.date).toLocaleDateString()}

⚽️ Goles: ${match.myGoals}
👟 Asistencias: ${match.myAssists}

📊 Acumulado ${matchYear}:
${yearlyWins}V - ${yearlyDraws}E - ${yearlyLosses}D
Goles: ${yearlyGoals} | Asist: ${yearlyAssists}

Generado con Plyon`;
  };

  const handleCopyText = async () => {
      try {
          await navigator.clipboard.writeText(getCopyText());
          setCopyStatus('copied');
          setTimeout(() => setCopyStatus('idle'), 2000);
      } catch (err) {
          setError('No se pudo copiar al portapapeles.');
      }
  };

  if (!isOpen) return null;

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 3000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
        backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
        boxShadow: theme.shadows.large, width: '100%', maxWidth: '450px',
        display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s ease',
        border: `1px solid ${theme.colors.border}`, overflow: 'hidden'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: theme.spacing.medium, borderBottom: `1px solid ${theme.colors.border}`,
    },
    title: { margin: 0, fontSize: '1.1rem', fontWeight: 700, color: theme.colors.primaryText },
    content: { padding: theme.spacing.large, display: 'flex', flexDirection: 'column', gap: theme.spacing.medium },
    tabs: { display: 'flex', padding: `0 ${theme.spacing.medium}`, borderBottom: `1px solid ${theme.colors.border}` },
    tab: {
        flex: 1, padding: theme.spacing.medium, background: 'none', border: 'none',
        cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: theme.colors.secondaryText,
        borderBottom: '2px solid transparent', transition: 'all 0.2s'
    },
    activeTab: { color: theme.colors.primaryText, borderBottom: `2px solid ${theme.colors.accent1}` },
    
    // Minimal wrapper for image generation
    cardPreview: {
        width: '100%',
        marginBottom: theme.spacing.medium,
        backgroundColor: 'transparent',
        overflow: 'hidden' // Prevent scrollbars from scaling tricks
    },

    // Text Styles
    textArea: {
        width: '100%', height: '200px', padding: theme.spacing.medium,
        backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText,
        fontSize: '0.9rem', fontFamily: 'monospace', resize: 'none',
        boxSizing: 'border-box'
    },
    
    buttonGroup: { display: 'flex', gap: theme.spacing.medium },
    button: {
        flex: 1, padding: '10px', borderRadius: theme.borderRadius.medium,
        border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
    },
    primaryBtn: { backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent },
    secondaryBtn: { backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText },
  };

  return createPortal(
    <div style={styles.backdrop} onClick={onClose}>
        <style>{`@keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.header}>
                <h3 style={styles.title}>Compartir Partido</h3>
                <button onClick={onClose} style={{background:'none', border:'none', cursor:'pointer'}}><CloseIcon color={theme.colors.primaryText}/></button>
            </div>
            
            <div style={styles.tabs}>
                <button style={{...styles.tab, ...(activeTab === 'image' ? styles.activeTab : {})}} onClick={() => setActiveTab('image')}>Imagen (Story)</button>
                <button style={{...styles.tab, ...(activeTab === 'text' ? styles.activeTab : {})}} onClick={() => setActiveTab('text')}>Texto (WhatsApp)</button>
            </div>

            <div style={styles.content}>
                
                <div style={{ display: activeTab === 'image' ? 'block' : 'none' }}>
                    <div style={styles.cardPreview}>
                        {/* Wrapper for capture. Using width 100% to fill modal. */}
                        <div ref={cardRef} style={{ width: '100%', backgroundColor: 'transparent' }}>
                            {/* 
                                Inner wrapper with scaling.
                                Width 111.11% * Scale 0.9 = ~100% visual width.
                                This effectively "zooms out" the card, giving 11% more space for text
                                while keeping the card fitted to the modal width.
                            */}
                            <div style={{ 
                                width: '111.11%', 
                                transform: 'scale(0.9)', 
                                transformOrigin: 'top left',
                                marginBottom: '-10%' // Compensate for vertical gap caused by scaling
                            }}>
                                <MatchCard 
                                    match={match}
                                    allMatches={allMatches}
                                    allPlayers={[]} 
                                    isReadOnly={true}
                                    forceExpanded={true}
                                    hideShareButton={true}
                                    hideCareerBanner={true}
                                    showFooterLogo={true}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div style={styles.buttonGroup}>
                        <button onClick={() => handleImageAction('download')} disabled={isGenerating} style={{...styles.button, ...styles.secondaryBtn}}>
                            <DownloadIcon size={18} /> {isGenerating ? '...' : 'Descargar'}
                        </button>
                        <button onClick={() => handleImageAction('share')} disabled={isGenerating} style={{...styles.button, ...styles.primaryBtn}}>
                            <ShareIcon size={18} /> {isGenerating ? '...' : 'Compartir'}
                        </button>
                    </div>
                    {error && <p style={{color: theme.colors.loss, textAlign: 'center', fontSize: '0.8rem', margin: 0}}>{error}</p>}
                </div>

                <div style={{ display: activeTab === 'text' ? 'block' : 'none' }}>
                    <textarea readOnly value={getCopyText()} style={styles.textArea} />
                    <button onClick={handleCopyText} style={{...styles.button, ...styles.primaryBtn}}>
                        <ClipboardIcon size={18} /> {copyStatus === 'copied' ? '¡Copiado!' : 'Copiar Texto'}
                    </button>
                </div>
            </div>
        </div>
    </div>,
    document.body
  );
};

export default ShareMatchOptionsModal;

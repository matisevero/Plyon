
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { CloseIcon } from '../icons/CloseIcon';
import { CONFEDERATIONS } from '../../utils/analytics';
import type { ConfederationName } from '../../types';
import { GlobeIcon } from '../icons/GlobeIcon';

interface ConfederationSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (confederation: ConfederationName) => void;
}

// Sub-component for individual cards to handle their own image error state
const ConfederationCard: React.FC<{
    confKey: string;
    conf: any;
    onSelect: (key: ConfederationName) => void;
    theme: any;
    getDifficultyColor: (multiplier: number) => string;
}> = ({ confKey, conf, onSelect, theme, getDifficultyColor }) => {
    const [imgError, setImgError] = useState(false);

    // Construct the expected URL based on theme
    const imageUrl = conf.logo[theme.name];

    // Reset error when URL changes (e.g. theme toggle)
    useEffect(() => {
        setImgError(false);
    }, [imageUrl]);

    const styles: React.CSSProperties = {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.border}`,
        padding: theme.spacing.medium,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.medium,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        position: 'relative' as 'relative',
    };

    // Increased size for better visibility
    const logoStyle: React.CSSProperties = {
        width: '50px',
        height: '50px',
        objectFit: 'contain',
        flexShrink: 0,
    };

    return (
        <div
            style={styles}
            onClick={() => onSelect(confKey as ConfederationName)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = theme.colors.accent1 }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = theme.colors.border }}
        >
            {imageUrl && !imgError ? (
                <img 
                    src={imageUrl} 
                    alt={`${conf.name} logo`} 
                    style={logoStyle} 
                    onError={() => setImgError(true)}
                />
            ) : (
                <GlobeIcon size={50} color={theme.colors.primaryText} />
            )}
            
            <div style={{ textAlign: 'left', flex: 1 }}>
                <h3 style={{ fontWeight: 700, color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium, margin: 0 }}>{conf.name}</h3>
                <p style={{ fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, margin: `0.1rem 0 0 0` }}>
                    {conf.slots} Cupos Directos {conf.playoffSlots > 0 && `+ ${conf.playoffSlots} Repechaje`}
                </p>
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', color: theme.colors.textOnAccent, marginLeft: 'auto', alignSelf: 'flex-start', backgroundColor: getDifficultyColor(conf.pointsMultiplier || 1) }}>
                {conf.difficulty || 'Normal'}
            </div>
        </div>
    );
};

const ConfederationSelectModal: React.FC<ConfederationSelectModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const getDifficultyColor = (multiplier: number) => {
      if (multiplier >= 3) return theme.colors.loss; // Hard
      if (multiplier >= 2) return theme.colors.accent3; // Medium
      return theme.colors.win; // Easy
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
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '450px',
      maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
      animation: 'scaleUp 0.3s ease', border: `1px solid ${theme.colors.border}`,
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderBottom: `1px solid ${theme.colors.border}`, flexShrink: 0,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    content: {
      padding: theme.spacing.medium,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.small,
    }
  };

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: ${theme.colors.borderStrong};
          border-radius: 10px;
          border: 2px solid ${theme.colors.surface};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: ${theme.colors.secondaryText};
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${theme.colors.borderStrong} ${theme.colors.surface};
        }
      `}</style>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()} className="custom-scrollbar">
          <header style={styles.header}>
            <h2 style={styles.title}>Elige una Confederación</h2>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          <div style={styles.content}>
            {Object.entries(CONFEDERATIONS).map(([key, conf]) => (
                <ConfederationCard 
                    key={key} 
                    confKey={key} 
                    conf={conf} 
                    onSelect={onSelect} 
                    theme={theme}
                    getDifficultyColor={getDifficultyColor}
                />
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};

export default ConfederationSelectModal;

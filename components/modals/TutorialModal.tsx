
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { CloseIcon } from '../icons/CloseIcon';
import { TutorialStep } from '../../types';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
  steps: TutorialStep[];
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, steps }) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Touch swipe state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const touchThreshold = 50; 

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentStep(0); 
      setDontShowAgain(true); 
    } else {
      document.body.style.overflow = 'auto';
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);
  
  const handleClose = () => {
    onClose(dontShowAgain);
  };

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    onClose(dontShowAgain);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0); 
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    setTouchDeltaX(currentX - touchStartX);
  };
  
  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX) > touchThreshold) {
      if (touchDeltaX < 0) { // Swiped left
        handleNext();
      } else { // Swiped right
        handlePrev();
      }
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
      backdropFilter: 'blur(5px)',
    },
    modal: {
      backgroundColor: theme.colors.surface,
      borderRadius: '24px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      width: isDesktop ? '700px' : '100%', // Full width on mobile with padding
      maxWidth: '700px',
      height: isDesktop ? '450px' : 'auto', // Auto height on mobile, but constrained by max-height
      maxHeight: '85vh', // Crucial: Leave space for browser UI
      display: 'flex',
      flexDirection: 'column',
      animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      border: `1px solid ${theme.colors.border}`,
      overflow: 'hidden', // Contain inner scroll
      position: 'relative',
    },
    closeButtonWrapper: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        zIndex: 10,
    },
    carouselContainer: {
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '250px', // Ensure visibility on small screens
    },
    carouselTrack: {
        display: 'flex',
        height: '100%',
        width: '100%',
        transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
        transform: `translateX(-${currentStep * 100}%)`,
    },
    carouselSlide: {
        flex: '0 0 100%',
        height: '100%',
        width: '100%',
        padding: isDesktop ? '0 4rem' : '2rem 1.5rem 0 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        overflowY: 'auto', // Scroll text if too long on tiny screens
    },
    iconCircle: {
        width: isDesktop ? '100px' : '80px',
        height: isDesktop ? '100px' : '80px',
        borderRadius: '50%',
        backgroundColor: `${theme.colors.accent1}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: isDesktop ? '2rem' : '1.5rem',
        boxShadow: `0 0 30px ${theme.colors.accent1}20`,
        flexShrink: 0,
    },
    icon: {
        color: theme.colors.accent1,
        transform: 'scale(1.2)',
    },
    stepTitle: {
        margin: '0 0 1rem 0',
        fontSize: isDesktop ? '1.75rem' : '1.5rem',
        fontWeight: 800,
        color: theme.colors.primaryText,
        lineHeight: 1.2,
    },
    stepContent: {
        fontSize: isDesktop ? '1rem' : '0.95rem',
        color: theme.colors.secondaryText,
        lineHeight: 1.6,
        margin: 0,
        maxWidth: '450px',
    },
    footer: {
      padding: isDesktop ? '2rem' : '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      alignItems: 'center',
      borderTop: isDesktop ? 'none' : `1px solid ${theme.colors.border}40`, // Visual separation on mobile
      backgroundColor: theme.colors.surface, // Ensure footer is opaque over content
      flexShrink: 0, // Prevent footer from shrinking
    },
    dotsContainer: {
        display: 'flex',
        gap: '0.5rem',
    },
    dot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: theme.colors.borderStrong,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
    },
    activeDot: {
        backgroundColor: theme.colors.accent1,
        transform: 'scale(1.2)',
        width: '20px',
        borderRadius: '4px',
    },
    controlsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    secondaryButton: {
        background: 'none',
        border: 'none',
        color: theme.colors.secondaryText,
        fontSize: '0.9rem',
        fontWeight: 600,
        cursor: 'pointer',
        padding: '0.5rem 1rem',
    },
    primaryButton: {
        backgroundColor: theme.colors.primaryText,
        color: theme.colors.surface,
        border: 'none',
        borderRadius: '50px',
        padding: '0.75rem 2rem',
        fontSize: '1rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'transform 0.1s',
        boxShadow: theme.shadows.medium,
    },
    checkboxContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
        opacity: 0.8,
    },
    checkboxLabel: {
        fontSize: '0.75rem',
        color: theme.colors.secondaryText,
        userSelect: 'none' as 'none',
    },
  };

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
      `}</style>
      <div style={styles.backdrop} onClick={handleClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.closeButtonWrapper}>
             <button style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }} onClick={handleClose}>
                <CloseIcon color={theme.colors.primaryText} />
             </button>
          </div>

          <div style={styles.carouselContainer} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <div style={styles.carouselTrack}>
              {steps.map((step, index) => (
                <div key={index} style={styles.carouselSlide}>
                  <div style={styles.iconCircle}>
                    {step.icon && <div style={styles.icon}>{step.icon}</div>}
                  </div>
                  <h3 style={styles.stepTitle}>{step.title}</h3>
                  <p style={styles.stepContent}>{step.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.footer}>
            <div style={styles.dotsContainer}>
              {steps.map((_, index) => (
                <div 
                  key={index} 
                  style={index === currentStep ? {...styles.dot, ...styles.activeDot} : styles.dot}
                  onClick={() => setCurrentStep(index)}
                ></div>
              ))}
            </div>
            
            <div style={styles.controlsRow}>
                <label style={styles.checkboxContainer}>
                    <input type="checkbox" checked={dontShowAgain} onChange={() => setDontShowAgain(!dontShowAgain)} />
                    <span style={styles.checkboxLabel}>No mostrar</span>
                </label>

                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    {currentStep > 0 && (
                        <button style={styles.secondaryButton} onClick={handlePrev}>
                            Atrás
                        </button>
                    )}
                    <button style={styles.primaryButton} onClick={handleNext}>
                        {currentStep < steps.length - 1 ? 'Siguiente' : '¡Vamos!'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
  
  return createPortal(modalJSX, document.body);
};

export default TutorialModal;

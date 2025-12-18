
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
  // UX Improvement: Default to true so closing via X or Finish automatically dismisses it forever unless unchecked.
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Touch swipe state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const touchThreshold = 50; // Minimum swipe distance in pixels

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentStep(0); // Reset to first step when opened
      setDontShowAgain(true); // Reset to true every time it opens to ensure good UX on close
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
  
  // Create a stable handleClose that uses the current state of dontShowAgain
  const handleClose = () => {
    onClose(dontShowAgain);
  };

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
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
    setTouchDeltaX(0); // Reset delta on new touch
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
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large,
      width: isDesktop ? '650px' : '90%',
      maxWidth: '650px',
      // Height increased to prevent clipping
      height: isDesktop ? '380px' : '550px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      animation: 'scaleUp 0.3s ease',
      border: `1px solid ${theme.colors.border}`,
      overflow: 'hidden',
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderBottom: `1px solid ${theme.colors.border}`,
      flexShrink: 0,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    carouselContainer: {
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
    },
    carouselTrack: {
        display: 'flex',
        height: '100%',
        width: '100%',
        transition: 'transform 0.4s ease-out',
        transform: `translateX(-${currentStep * 100}%)`,
    },
    carouselSlide: {
        flex: '0 0 100%',
        height: '100%',
        width: '100%',
        padding: isDesktop ? '0 3rem' : '0 2rem 2rem 2rem',
        textAlign: isDesktop ? 'left' : 'center',
        display: 'flex',
        flexDirection: isDesktop ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        gap: isDesktop ? '2rem' : '1.5rem',
        overflowY: 'auto', // Allow scrolling if content is too long
    },
    iconContainer: {
        height: isDesktop ? 'auto' : '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: isDesktop ? 0 : theme.spacing.medium,
        flexShrink: 0,
    },
    icon: {
        color: theme.colors.accent1,
    },
    textContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: isDesktop ? 1 : 'unset', // Allow text to take width on desktop
    },
    stepTitle: {
        margin: `0 0 ${theme.spacing.medium} 0`,
        fontSize: '1.2rem',
        fontWeight: 700,
        color: theme.colors.primaryText,
    },
    stepContent: {
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.secondaryText,
        lineHeight: 1.6,
        margin: 0,
    },
    footer: {
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderTop: `1px solid ${theme.colors.border}`,
      flexShrink: 0,
    },
    progressContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.medium,
    },
    dotsContainer: {
        display: 'flex',
        gap: theme.spacing.small,
    },
    dot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: theme.colors.borderStrong,
        transition: 'background-color 0.3s',
        cursor: 'pointer',
    },
    activeDot: {
        backgroundColor: theme.colors.accent1,
    },
    navContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.medium,
    },
    navButton: {
        background: 'none',
        border: 'none',
        color: theme.colors.secondaryText,
        fontWeight: 600,
        fontSize: theme.typography.fontSize.small,
        cursor: 'pointer',
        padding: `${theme.spacing.small} 0`,
        visibility: 'visible' as 'visible',
    },
    navButtonHidden: {
        visibility: 'hidden' as 'hidden',
    },
    finishButton: {
        color: theme.colors.accent1,
        fontWeight: 700,
    },
    checkboxContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.small,
        cursor: 'pointer',
    },
    checkboxLabel: {
        fontSize: theme.typography.fontSize.extraSmall,
        color: theme.colors.secondaryText,
        userSelect: 'none' as 'none',
    },
  };

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }
      `}</style>
      <div style={styles.backdrop} onClick={handleClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <header style={styles.header}>
            <h2 style={styles.title}>Guía Rápida</h2>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleClose}><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          <div style={styles.carouselContainer} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <div style={styles.carouselTrack}>
              {steps.map((step, index) => (
                <div key={index} style={styles.carouselSlide}>
                  <div style={styles.iconContainer}>
                    {step.icon && <div style={styles.icon}>{step.icon}</div>}
                  </div>
                  <div style={styles.textContainer}>
                    <h3 style={styles.stepTitle}>{step.title}</h3>
                    <p style={styles.stepContent}>{step.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <footer style={styles.footer}>
            <div style={styles.progressContainer}>
              <div style={styles.dotsContainer}>
                {steps.map((_, index) => (
                  <div 
                    key={index} 
                    style={index === currentStep ? {...styles.dot, ...styles.activeDot} : styles.dot}
                    onClick={() => setCurrentStep(index)}
                  ></div>
                ))}
              </div>
            </div>
            <div style={styles.navContainer}>
                <button
                    style={currentStep > 0 ? styles.navButton : {...styles.navButton, ...styles.navButtonHidden}}
                    onClick={handlePrev}
                >
                    Anterior
                </button>
                 <label style={styles.checkboxContainer}>
                    <input type="checkbox" checked={dontShowAgain} onChange={() => setDontShowAgain(!dontShowAgain)} />
                    <span style={styles.checkboxLabel}>No volver a mostrar</span>
                </label>
                <button
                    style={currentStep < steps.length - 1 ? styles.navButton : {...styles.navButton, ...styles.finishButton}}
                    onClick={currentStep < steps.length - 1 ? handleNext : handleFinish}
                >
                    {currentStep < steps.length - 1 ? 'Siguiente' : 'Finalizar'}
                </button>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
  
  return createPortal(modalJSX, document.body);
};

export default TutorialModal;

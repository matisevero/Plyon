
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { analyzeAndRespondToFeedback } from '../../services/geminiService';
import { CloseIcon } from '../icons/CloseIcon';
import { Loader } from '../Loader';
import { ChatBubbleIcon } from '../icons/ChatBubbleIcon';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { addAIInteraction } = useData();

  const [feedbackType, setFeedbackType] = useState('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        setFeedbackType('general');
        setFeedbackText('');
        setResponse(null);
        setError(null);
        setIsSending(false);
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!feedbackText.trim()) return;

      setIsSending(true);
      setError(null);
      setResponse(null);

      try {
          // Use the existing geminiService function
          const result = await analyzeAndRespondToFeedback(feedbackType, feedbackText);
          
          setResponse(result.response_to_user);
          
          // Log the interaction for record keeping (and hypothetical backend processing)
          await addAIInteraction('feedback', { 
              type: feedbackType, 
              text: feedbackText, 
              analysis: result 
          });

      } catch (err: any) {
          console.error("Error sending feedback:", err);
          setError("Hubo un problema al enviar tu feedback. Por favor intenta más tarde.");
      } finally {
          setIsSending(false);
      }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 3000,
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
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText, display: 'flex', alignItems: 'center', gap: '8px' },
    content: {
        padding: theme.spacing.large,
        display: 'flex', flexDirection: 'column',
        gap: theme.spacing.large,
    },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.medium },
    select: {
        padding: theme.spacing.medium, backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium,
        color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium,
        outline: 'none',
    },
    textarea: {
        padding: theme.spacing.medium, backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium,
        color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium,
        outline: 'none', minHeight: '120px', resize: 'vertical', fontFamily: theme.typography.fontFamily
    },
    button: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: `${theme.spacing.medium} ${theme.spacing.large}`,
        borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium,
        fontWeight: 'bold', cursor: 'pointer', transition: 'filter 0.2s',
        border: 'none', width: '100%', minHeight: '48px',
        backgroundColor: theme.colors.accent2, color: theme.colors.textOnAccent,
    },
    responseContainer: {
        backgroundColor: `${theme.colors.accent1}15`,
        border: `1px solid ${theme.colors.accent1}40`,
        borderRadius: theme.borderRadius.medium,
        padding: theme.spacing.medium,
        textAlign: 'center'
    },
    responseText: {
        color: theme.colors.primaryText,
        fontSize: '0.95rem',
        lineHeight: 1.5,
        margin: 0,
        marginBottom: theme.spacing.medium
    }
  };

  return createPortal(
    <>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }
        `}</style>
        <div style={styles.backdrop} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <header style={styles.header}>
                    <h2 style={styles.title}><ChatBubbleIcon /> Feedback</h2>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose} aria-label="Cerrar"><CloseIcon color={theme.colors.primaryText} /></button>
                </header>
                <div style={styles.content}>
                    {response ? (
                        <div style={styles.responseContainer}>
                            <p style={styles.responseText}>{response}</p>
                            <button 
                                onClick={onClose}
                                style={{...styles.button, backgroundColor: theme.colors.accent1}}
                            >
                                Cerrar
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={styles.form}>
                            <select 
                                value={feedbackType} 
                                onChange={(e) => setFeedbackType(e.target.value)}
                                style={styles.select}
                            >
                                <option value="general">Comentario General</option>
                                <option value="bug">Reportar Error</option>
                                <option value="feature">Sugerir Funcionalidad</option>
                                <option value="data">Problema con mis datos</option>
                            </select>
                            
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Cuéntanos qué piensas o qué problema encontraste..."
                                style={styles.textarea}
                                required
                            />

                            {error && (
                                <p style={{color: theme.colors.loss, fontSize: '0.85rem', margin: 0, padding: '8px', backgroundColor: `${theme.colors.loss}15`, borderRadius: '8px'}}>
                                    {error}
                                </p>
                            )}

                            <button type="submit" disabled={isSending} style={styles.button}>
                                {isSending ? <Loader /> : 'Enviar Comentarios'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    </>,
    document.body
  );
};

export default FeedbackModal;

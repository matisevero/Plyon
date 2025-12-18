
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { parseMatchesFromText } from '../../services/geminiService';
import { CloseIcon } from '../icons/CloseIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { Loader } from '../Loader';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { importMatchesFromAI, checkAILimit, aiUsageCount, AI_MONTHLY_LIMIT, addAIInteraction } = useData();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!inputText.trim()) return;
    
    try {
        checkAILimit();
    } catch (e: any) {
        setError(e.message);
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const parsedMatches = await parseMatchesFromText(inputText);
      if (parsedMatches.length === 0) {
          setError("No se encontraron partidos en el texto.");
      } else {
          await importMatchesFromAI(parsedMatches);
          // Log interaction to count usage
          await addAIInteraction('match_summary', { summary: `Imported from text: "${inputText.substring(0, 50)}..."` }); 
          onClose();
          setInputText('');
      }
    } catch (err: any) {
      setError(err.message || "Error al interpretar el texto.");
    } finally {
      setIsLoading(false);
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
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '600px',
      display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s ease',
      border: `1px solid ${theme.colors.border}`,
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText, display: 'flex', alignItems: 'center', gap: '0.5rem' },
    content: { padding: theme.spacing.large, display: 'flex', flexDirection: 'column', gap: theme.spacing.medium },
    textarea: {
        width: '100%', height: '200px', padding: theme.spacing.medium,
        backgroundColor: theme.colors.background, color: theme.colors.primaryText,
        border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium,
        resize: 'vertical', fontSize: theme.typography.fontSize.medium,
        fontFamily: theme.typography.fontFamily, boxSizing: 'border-box'
    },
    button: {
        padding: `${theme.spacing.medium} ${theme.spacing.large}`,
        borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium,
        fontWeight: 'bold', cursor: 'pointer',
        backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent,
        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
    },
    helperText: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, margin: 0 },
    errorText: { color: theme.colors.loss, fontSize: theme.typography.fontSize.small },
    limitText: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, textAlign: 'center', marginTop: '0.5rem' }
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
            <h2 style={styles.title}><SparklesIcon /> Importar con IA</h2>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          <div style={styles.content}>
            <p style={styles.helperText}>
                Pega aquí tus notas, mensajes de WhatsApp o cualquier texto libre. La IA interpretará los partidos y los añadirá a tu historial.
                <br/><br/>
                Ejemplo: <em>"Ayer ganamos 5-3, metí 2 goles. El jueves pasado perdimos 1-0."</em>
            </p>
            <textarea 
                style={styles.textarea} 
                placeholder="Escribe o pega tus partidos aquí..." 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
            />
            {error && <p style={styles.errorText}>{error}</p>}
            <button style={styles.button} onClick={handleImport} disabled={isLoading || !inputText.trim()}>
                {isLoading ? <Loader /> : 'Analizar e Importar'}
            </button>
            <div style={styles.limitText}>Usos mensuales: {aiUsageCount}/{AI_MONTHLY_LIMIT}</div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};

export default SmartImportModal;
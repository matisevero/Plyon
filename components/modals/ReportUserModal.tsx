
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { reportUser } from '../../services/firebaseService';
import { CloseIcon } from '../icons/CloseIcon';
import { Loader } from '../Loader';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
}

const REPORT_REASONS = [
    "Spam o contenido comercial no deseado",
    "Acoso o intimidación",
    "Lenguaje inapropiado o discurso de odio",
    "Nombre de usuario ofensivo",
    "Suplantación de identidad",
    "Información falsa o engañosa"
];

const ReportUserModal: React.FC<ReportUserModalProps> = ({ isOpen, onClose, reportedUserId, reportedUserName }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [comments, setComments] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      
      setIsLoading(true);
      try {
          await reportUser(user.uid, reportedUserId, reason, comments);
          alert("Gracias por tu reporte. Nuestro equipo revisará la información.");
          onClose();
      } catch (err) {
          console.error(err);
          alert("Hubo un error al enviar el reporte.");
      } finally {
          setIsLoading(false);
      }
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
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '450px',
      display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s ease',
      border: `1px solid ${theme.colors.border}`,
      padding: theme.spacing.large
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: theme.spacing.large, borderBottom: `1px solid ${theme.colors.border}`,
      paddingBottom: theme.spacing.medium
    },
    title: { margin: 0, fontSize: '1.2rem', fontWeight: 700, color: theme.colors.loss },
    fieldGroup: { marginBottom: theme.spacing.medium },
    label: { display: 'block', marginBottom: '8px', fontWeight: 600, color: theme.colors.primaryText, fontSize: '0.9rem' },
    select: {
        width: '100%', padding: '10px', borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.borderStrong}`, backgroundColor: theme.colors.background,
        color: theme.colors.primaryText, fontSize: '0.9rem'
    },
    textarea: {
        width: '100%', padding: '10px', borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.borderStrong}`, backgroundColor: theme.colors.background,
        color: theme.colors.primaryText, fontSize: '0.9rem', minHeight: '80px', resize: 'vertical'
    },
    buttonGroup: { display: 'flex', gap: '10px', marginTop: theme.spacing.large },
    cancelBtn: {
        flex: 1, padding: '10px', borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.borderStrong}`,
        background: 'transparent', color: theme.colors.primaryText, cursor: 'pointer', fontWeight: 'bold'
    },
    submitBtn: {
        flex: 1, padding: '10px', borderRadius: theme.borderRadius.medium, border: 'none',
        background: theme.colors.loss, color: '#fff', cursor: 'pointer', fontWeight: 'bold',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    }
  };

  return createPortal(
    <div style={styles.backdrop} onClick={onClose}>
        <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }`}</style>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
            <h2 style={styles.title}>Reportar a {reportedUserName}</h2>
            <button onClick={onClose} style={{background: 'none', border: 'none', cursor: 'pointer'}}><CloseIcon color={theme.colors.primaryText} /></button>
        </div>
        <form onSubmit={handleSubmit}>
            <div style={styles.fieldGroup}>
                <label style={styles.label}>Motivo del reporte</label>
                <select style={styles.select} value={reason} onChange={e => setReason(e.target.value)}>
                    {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div style={styles.fieldGroup}>
                <label style={styles.label}>Comentarios adicionales (opcional)</label>
                <textarea 
                    style={styles.textarea} 
                    value={comments} 
                    onChange={e => setComments(e.target.value)}
                    placeholder="Describe el problema con más detalle..."
                />
            </div>
            <div style={styles.buttonGroup}>
                <button type="button" onClick={onClose} style={styles.cancelBtn} disabled={isLoading}>Cancelar</button>
                <button type="submit" style={styles.submitBtn} disabled={isLoading}>
                    {isLoading ? <Loader /> : 'Enviar Reporte'}
                </button>
            </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ReportUserModal;

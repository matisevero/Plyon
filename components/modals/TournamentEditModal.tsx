import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import type { Tournament } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';

interface TournamentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tournament: Tournament) => void;
  tournament: Tournament | null;
}

const TournamentEditModal: React.FC<TournamentEditModalProps> = ({ isOpen, onClose, onSave, tournament }) => {
    const { theme } = useTheme();
    const [formData, setFormData] = useState<Tournament | null>(null);

    useEffect(() => {
        if (tournament) {
            setFormData(tournament);
        }
    }, [tournament]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!isOpen || !formData) return null;

    const handleChange = (field: keyof Tournament, value: any) => {
        const processedValue = (field === 'matchDuration' || field === 'playersPerSide') ? parseInt(value, 10) || 0 : value;
        setFormData(prev => prev ? { ...prev, [field]: processedValue } : null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) {
            onSave(formData);
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
            padding: theme.spacing.large, display: 'flex', flexDirection: 'column',
            gap: theme.spacing.large,
        },
        fieldGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
        label: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontWeight: 500 },
        input: {
            width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium,
            color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium,
            boxSizing: 'border-box'
        },
        colorInput: {
            height: '48px',
            padding: theme.spacing.small,
        },
        button: {
            padding: `${theme.spacing.medium} ${theme.spacing.large}`,
            borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium,
            fontWeight: 'bold', cursor: 'pointer',
            backgroundColor: theme.colors.accent1,
            color: theme.colors.textOnAccent,
            border: 'none',
        },
    };

    const modalJSX = (
        <div style={styles.backdrop} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <header style={styles.header}>
                    <h2 style={styles.title}>Editar Torneo</h2>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
                </header>
                <form onSubmit={handleSave}>
                    <div style={styles.content}>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Nombre del Torneo</label>
                            <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} style={styles.input} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium }}>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Duración (min)</label>
                                <input type="number" value={formData.matchDuration} onChange={e => handleChange('matchDuration', e.target.value)} style={styles.input} />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Jugadores / lado</label>
                                <input type="number" value={formData.playersPerSide} onChange={e => handleChange('playersPerSide', e.target.value)} style={styles.input} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium }}>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Ícono (Emoji)</label>
                                <input type="text" value={formData.icon} onChange={e => handleChange('icon', e.target.value)} style={styles.input} maxLength={2} />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Color</label>
                                <input type="color" value={formData.color} onChange={e => handleChange('color', e.target.value)} style={{...styles.input, ...styles.colorInput}} />
                            </div>
                        </div>
                        <button type="submit" style={styles.button}>Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalJSX, document.body);
};

export default TournamentEditModal;

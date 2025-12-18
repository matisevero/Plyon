
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { Loader } from '../Loader';

const DataConflictModal: React.FC = () => {
    const { theme } = useTheme();
    const { dataConflict, resolveConflict } = useData();
    const [isLoading, setIsLoading] = useState<null | 'local' | 'cloud'>(null);

    if (!dataConflict) {
        return null;
    }

    const handleResolve = async (choice: 'local' | 'cloud') => {
        setIsLoading(choice);
        await resolveConflict(choice);
        // No need to set loading to false, component will unmount or state will change
    };

    const styles: { [key: string]: React.CSSProperties } = {
        backdrop: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
        },
        modal: {
            backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
            boxShadow: theme.shadows.large, width: '100%', maxWidth: '500px',
            display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s ease',
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.extraLarge,
            textAlign: 'center',
        },
        title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
        description: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, lineHeight: 1.6, margin: `${theme.spacing.medium} 0 ${theme.spacing.large} 0`},
        warning: { color: theme.colors.loss, fontWeight: 'bold', display: 'block', marginTop: '0.5rem' },
        buttonContainer: { display: 'flex', flexDirection: 'column', gap: theme.spacing.medium },
        button: {
            padding: `${theme.spacing.medium} ${theme.spacing.large}`,
            borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium,
            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: theme.spacing.medium, border: '1px solid',
            transition: 'background-color 0.2s, color 0.2s', minHeight: '56px',
        },
    };

    const modalJSX = (
        <>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }
            `}</style>
            <div style={styles.backdrop}>
                <div style={styles.modal}>
                    <h2 style={styles.title}>⚠️ Conflicto de Datos</h2>
                    <p style={styles.description}>
                        Tienes datos guardados en este dispositivo, pero también hemos encontrado datos en tu cuenta en la nube.
                        <span style={styles.warning}>Debes elegir qué datos conservar. La otra opción se perderá permanentemente.</span>
                    </p>
                    <div style={styles.buttonContainer}>
                        <button 
                            style={{...styles.button, backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent, borderColor: theme.colors.accent1 }}
                            onClick={() => handleResolve('local')}
                            disabled={!!isLoading}
                        >
                            {isLoading === 'local' ? <Loader /> : 'SUBIR DATOS LOCALES (Sobreescribir Nube)'}
                        </button>
                        <button 
                            style={{...styles.button, backgroundColor: 'transparent', color: theme.colors.primaryText, borderColor: theme.colors.borderStrong }}
                            onClick={() => handleResolve('cloud')}
                            disabled={!!isLoading}
                        >
                            {isLoading === 'cloud' ? <Loader /> : 'DESCARGAR NUBE (Borrar datos de este dispositivo)'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(modalJSX, document.body);
};

export default DataConflictModal;

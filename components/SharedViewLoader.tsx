
import React, { useEffect, useState } from 'react';
import { DataProvider } from '../contexts/DataContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import * as firebaseService from '../services/firebaseService';
import { Loader } from './Loader';
import { FootballIcon } from './icons/FootballIcon';
import StatsPage from '../pages/StatsPage';
import TablePage from '../pages/TablePage';
import { DuelsPage } from '../pages/DuelsPage';
import ProgressPage from '../pages/ProgressPage';
import type { Page } from '../types';

const SharedHeader: React.FC<{ playerName: string }> = ({ playerName }) => {
    const { theme } = useTheme();
    return (
        <header style={{
            backgroundColor: theme.colors.surface,
            padding: '0.75rem 1.5rem',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: theme.shadows.small
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FootballIcon size={24} color={theme.colors.accent1} />
                <span style={{ fontWeight: 700, color: theme.colors.primaryText, fontSize: '1.1rem' }}>
                    Ply<span style={{ color: theme.colors.accent2 }}>on</span>
                </span>
            </div>
            <div style={{ fontSize: '0.9rem', color: theme.colors.secondaryText }}>
                Viendo perfil de <strong style={{ color: theme.colors.primaryText }}>{playerName}</strong>
            </div>
        </header>
    );
}

const SharedContent: React.FC<{ page: string; playerName: string }> = ({ page, playerName }) => {
    const { theme } = useTheme();
    
    let PageComponent = StatsPage;
    if (page === 'table') PageComponent = TablePage;
    if (page === 'duels') PageComponent = DuelsPage;
    if (page === 'progress') PageComponent = ProgressPage;

    return (
        <div style={{
            minHeight: '100vh',
            background: theme.colors.backgroundGradient,
            color: theme.colors.primaryText,
            fontFamily: theme.typography.fontFamily,
        }}>
            <SharedHeader playerName={playerName} />
            <div style={{ paddingBottom: '2rem' }}>
                <PageComponent />
            </div>
            <div style={{ textAlign: 'center', padding: '2rem', color: theme.colors.secondaryText, fontSize: '0.8rem' }}>
                <p>Esta es una vista de solo lectura.</p>
                <a href="/" style={{ color: theme.colors.accent1, textDecoration: 'none', fontWeight: 'bold' }}>Crear mi propio Plyr en Plyon</a>
            </div>
        </div>
    );
}

const SharedViewLoader: React.FC<{ shareId: string }> = ({ shareId }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [targetPage, setTargetPage] = useState<string>('stats');
    const [playerName, setPlayerName] = useState<string>('Plyr');

    useEffect(() => {
        const fetchSharedData = async () => {
            try {
                const result = await firebaseService.getSharedView(shareId);
                
                if (!result) throw new Error("El enlace ha expirado o no existe.");
                if (!result.snapshot) throw new Error("Datos no encontrados en el enlace.");

                setData(result.snapshot);
                setTargetPage(result.page || 'stats');
                setPlayerName(result.playerProfileName || result.snapshot.playerProfile?.name || 'Plyr');
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Error al cargar los datos.");
            } finally {
                setLoading(false);
            }
        };
        fetchSharedData();
    }, [shareId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#121829', color: '#fff' }}>
                <Loader />
                <p style={{ marginTop: '1rem' }}>Cargando perfil compartido...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#121829', color: '#fff', padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#FF5252' }}>Error</h2>
                <p>{error}</p>
                <a href="/" style={{ marginTop: '1rem', color: '#00E676' }}>Ir al inicio</a>
            </div>
        );
    }

    return (
        <ThemeProvider>
            <DataProvider initialData={data} readOnlyMode={true}>
                <SharedContent page={targetPage} playerName={playerName} />
            </DataProvider>
        </ThemeProvider>
    );
};

export default SharedViewLoader;

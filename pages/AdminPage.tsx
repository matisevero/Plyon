
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import Card from '../components/common/Card';
import { BarChartIcon } from '../components/icons/BarChartIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { DatabaseIcon } from '../components/icons/DatabaseIcon';

const AdminPage: React.FC = () => {
    const { theme } = useTheme();
    const { setCurrentPage } = useData();
    const [activeTab, setActiveTab] = useState('dashboard');

    const styles: { [key: string]: React.CSSProperties } = {
        container: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: theme.spacing.large,
            color: theme.colors.primaryText
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.extraLarge
        },
        title: {
            fontSize: theme.typography.fontSize.extraLarge,
            fontWeight: 800,
            margin: 0
        },
        backBtn: {
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${theme.colors.borderStrong}`,
            background: 'transparent',
            color: theme.colors.primaryText,
            cursor: 'pointer'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: theme.spacing.large,
            marginBottom: theme.spacing.extraLarge
        },
        metricCard: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.medium,
            padding: theme.spacing.large
        },
        metricValue: {
            fontSize: '2.5rem',
            fontWeight: 900,
            lineHeight: 1
        },
        metricLabel: {
            fontSize: '0.9rem',
            color: theme.colors.secondaryText,
            textTransform: 'uppercase'
        }
    };

    // Mock Data for MVP - In real app, fetch from Firebase Admin SDK or specific collection
    const metrics = [
        { label: 'Usuarios Totales', value: '1,240', icon: <UsersIcon size={32} color={theme.colors.accent1} /> },
        { label: 'Partidos Registrados', value: '15.4k', icon: <DatabaseIcon size={32} color={theme.colors.accent2} /> },
        { label: 'Uso de IA (Mes)', value: '3,502', icon: <BarChartIcon size={32} color={theme.colors.accent3} /> },
    ];

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Panel de Control</h1>
                <button style={styles.backBtn} onClick={() => setCurrentPage('settings')}>
                    Volver a App
                </button>
            </header>

            <div style={styles.grid}>
                {metrics.map((m, i) => (
                    <Card key={i}>
                        <div style={styles.metricCard}>
                            <div>{m.icon}</div>
                            <div>
                                <div style={styles.metricValue}>{m.value}</div>
                                <div style={styles.metricLabel}>{m.label}</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card title="Actividad Reciente del Sistema">
                <div style={{padding: theme.spacing.medium, color: theme.colors.secondaryText}}>
                    <p>• Nuevo pico de usuarios registrados (ayer)</p>
                    <p>• Base de datos optimizada automáticamente</p>
                    <p>• 5 reportes de usuarios pendientes de revisión</p>
                </div>
            </Card>
        </div>
    );
};

export default AdminPage;

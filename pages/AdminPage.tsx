import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { isUserAdmin } from '../services/userService';
import DashboardKPIs from '../components/admin/DashboardKPIs';
import UserManagement from '../components/admin/UserManagement';

const AdminPage: React.FC = () => {
    const { theme } = useTheme();
    const { setCurrentPage } = useData();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) {
                setCurrentPage('landing');
                return;
            }
            const adminStatus = await isUserAdmin(user.uid);
            setIsAdmin(adminStatus);
            if (!adminStatus) {
                alert('No tienes permisos de admin');
                setCurrentPage('recorder');
            }
            setLoading(false);
        };
        checkAdmin();
    }, [user, setCurrentPage]);

    if (loading) {
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                color: theme.colors.primaryText,
                background: theme.colors.background,
                minHeight: '100vh'
            }}>
                Verificando permisos...
            </div>
        );
    }

    if (!isAdmin) return null;

    const styles = {
        container: {
            minHeight: '100vh',
            background: theme.colors.background,
            color: theme.colors.primaryText,
            padding: theme.spacing.large
        },
        header: {
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.extraLarge
        },
        title: {
            fontSize: theme.typography.fontSize.extraLarge,
            fontWeight: 900,
            margin: 0
        },
        backBtn: {
            padding: '12px 24px',
            borderRadius: '12px',
            background: theme.colors.cardBackground,
            color: theme.colors.primaryText,
            border: `1px solid ${theme.colors.borderStrong}`,
            cursor: 'pointer',
            fontSize: theme.typography.fontSize.medium,
            fontWeight: 600,
            transition: 'all 0.2s'
        },
        content: {
            maxWidth: '1400px',
            margin: '0 auto'
        },
        tabs: {
            display: 'flex',
            gap: theme.spacing.small,
            marginBottom: theme.spacing.large,
            borderBottom: `2px solid ${theme.colors.borderStrong}`
        },
        tab: {
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            color: theme.colors.secondaryText,
            cursor: 'pointer',
            fontSize: theme.typography.fontSize.medium,
            fontWeight: 600,
            borderBottom: '3px solid transparent',
            transition: 'all 0.2s'
        },
        activeTab: {
            color: theme.colors.accent1,
            borderBottomColor: theme.colors.accent1
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Panel de Administración</h1>
                <button
                    onClick={() => setCurrentPage('settings')}
                    style={styles.backBtn}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.borderStrong}
                    onMouseLeave={(e) => e.currentTarget.style.background = theme.colors.cardBackground}
                >
                    ← Volver
                </button>
            </div>

            <div style={styles.content}>
                <div style={styles.tabs}>
                    <button
                        style={{...styles.tab, ...(activeTab === 'dashboard' ? styles.activeTab : {})}}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        📊 Dashboard
                    </button>
                    <button
                        style={{...styles.tab, ...(activeTab === 'users' ? styles.activeTab : {})}}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 Usuarios
                    </button>
                </div>

                {activeTab === 'dashboard' && <DashboardKPIs />}
                {activeTab === 'users' && <UserManagement />}
            </div>
        </div>
    );
};

export default AdminPage;

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { isUserAdmin } from '../services/userService';
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
        return <div style={{padding: '40px', textAlign: 'center', color: '#fff'}}>Verificando permisos...</div>;
    }

    if (!isAdmin) return null;

    const styles = {
        container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', color: '#fff' },
        header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
        tabs: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #333' },
        tab: { padding: '10px 20px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' },
        activeTab: { color: '#00D9FF', borderBottom: '3px solid #00D9FF' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>Panel de Administración</h1>
                <button onClick={() => setCurrentPage('settings')} style={{padding: '10px 20px', borderRadius: '8px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer'}}>
                    Volver
                </button>
            </div>

            <div style={styles.tabs}>
                <button style={{...styles.tab, ...(activeTab === 'dashboard' ? styles.activeTab : {})}} onClick={() => setActiveTab('dashboard')}>
                    Dashboard
                </button>
                <button style={{...styles.tab, ...(activeTab === 'users' ? styles.activeTab : {})}} onClick={() => setActiveTab('users')}>
                    Usuarios
                </button>
            </div>

            {activeTab === 'dashboard' && (
                <div style={{padding: '20px', background: '#1a1f2e', borderRadius: '12px'}}>
                    <h2>Métricas del Sistema</h2>
                    <p>Dashboard próximamente...</p>
                </div>
            )}

            {activeTab === 'users' && <UserManagement />}
        </div>
    );
};

export default AdminPage;

import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getAllUsers, updateUserRole, UserProfile, UserRole } from '../../services/userService';

const UserManagement: React.FC = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await getAllUsers();
      setUsers(usersData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      await updateUserRole(uid, newRole);
      await loadUsers();
      alert('Rol actualizado correctamente');
    } catch (error) {
      alert('Error al actualizar rol');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getTimeSince = (date: any) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  };

  const getUserName = (user: UserProfile) => {
    if (user.displayName && user.displayName !== user.email?.split('@')[0]) {
      return user.displayName;
    }
    if (user.matchName) {
      return `${user.matchName} ⚽`;
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'Sin nombre';
  };

  if (loading) {
    return (
      <div style={{padding: theme.spacing.large, color: theme.colors.secondaryText}}>
        Cargando usuarios...
      </div>
    );
  }

  const styles = {
    container: {
      background: theme.colors.cardBackground,
      borderRadius: '16px',
      padding: theme.spacing.large,
      border: `1px solid ${theme.colors.borderSubtle}`
    },
    title: {
      fontSize: theme.typography.fontSize.large,
      fontWeight: 700,
      marginBottom: theme.spacing.large,
      color: theme.colors.primaryText
    },
    tableWrapper: {
      overflowX: 'auto' as const
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      minWidth: '900px'
    },
    th: {
      padding: theme.spacing.medium,
      textAlign: 'left' as const,
      color: theme.colors.secondaryText,
      fontWeight: 600,
      fontSize: '0.75rem',
      textTransform: 'uppercase' as const,
      borderBottom: `2px solid ${theme.colors.borderStrong}`
    },
    td: {
      padding: theme.spacing.medium,
      color: theme.colors.primaryText,
      borderBottom: `1px solid ${theme.colors.borderSubtle}`,
      fontSize: theme.typography.fontSize.small
    },
    select: {
      backgroundColor: theme.colors.background,
      color: theme.colors.primaryText,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: '8px',
      padding: '6px 12px',
      fontSize: '0.75rem',
      cursor: 'pointer',
      fontWeight: 600
    },
    badge: {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: 700,
      display: 'inline-block'
    },
    badgeAdmin: {
      backgroundColor: theme.colors.accent1,
      color: '#000'
    },
    badgeUser: {
      backgroundColor: theme.colors.borderStrong,
      color: theme.colors.primaryText
    },
    timeRecent: {
      color: theme.colors.accent2
    },
    timeOld: {
      color: theme.colors.secondaryText
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>👥 Usuarios Registrados ({users.length})</h3>
      
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nombre</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Rol</th>
              <th style={styles.th}>Registro</th>
              <th style={styles.th}>Último Login</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const daysSinceLogin = user.lastLogin 
                ? Math.floor((new Date().getTime() - (user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin)).getTime()) / (1000 * 60 * 60 * 24))
                : 999;
              
              return (
                <tr key={user.uid}>
                  <td style={styles.td}>
                    <strong>{getUserName(user)}</strong>
                  </td>
                  <td style={styles.td}>{user.email || '-'}</td>
                  <td style={styles.td}>
                    <span style={{...styles.badge, ...(user.role === 'admin' ? styles.badgeAdmin : styles.badgeUser)}}>
                      {user.role === 'admin' ? '⭐ Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{...styles.td, ...(daysSinceLogin < 7 ? styles.timeRecent : styles.timeOld)}}>
                    {getTimeSince(user.lastLogin)}
                  </td>
                  <td style={styles.td}>
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                      style={styles.select}
                    >
                      <option value="user">Hacer Usuario</option>
                      <option value="admin">Hacer Admin</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;

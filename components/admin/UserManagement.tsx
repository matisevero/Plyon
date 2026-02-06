import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole, UserProfile, UserRole } from '../../services/userService';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
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
      alert('Rol actualizado');
    } catch (error) {
      alert('Error al actualizar');
    }
  };

  if (loading) return <div style={{padding: '20px', color: '#fff'}}>Cargando...</div>;

  return (
    <div style={{padding: '20px', color: '#fff'}}>
      <h3>Usuarios ({users.length})</h3>
      {users.map(user => (
        <div key={user.uid} style={{padding: '10px', borderBottom: '1px solid #333', marginBottom: '10px'}}>
          <p><strong>{user.email}</strong></p>
          <select value={user.role} onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}>
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      ))}
    </div>
  );
};

export default UserManagement;

import React, { useEffect, useState } from 'react';
import { getDashboardMetrics, DashboardMetrics } from '../../services/metricsService';

const DashboardKPIs: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    const data = await getDashboardMetrics();
    setMetrics(data);
    setLoading(false);
  };

  if (loading) {
    return <div style={styles.loading}>Cargando métricas...</div>;
  }

  const kpis = [
    {
      label: 'Usuarios Totales',
      value: metrics?.totalUsers || 0,
      icon: '👥',
      color: '#00D9FF'
    },
    {
      label: 'Nuevos Hoy',
      value: metrics?.newUsersToday || 0,
      icon: '✨',
      color: '#00FF88'
    },
    {
      label: 'Usuarios Activos (7d)',
      value: metrics?.activeUsersWeek || 0,
      icon: '🔥',
      color: '#FF6B6B'
    },
    {
      label: 'Partidos Registrados',
      value: metrics?.totalMatches || 0,
      icon: '⚽',
      color: '#FFB800'
    }
  ];

  return (
    <div style={styles.container}>
      {kpis.map((kpi, index) => (
        <div key={index} style={{...styles.card, borderLeft: `4px solid ${kpi.color}`}}>
          <div style={styles.icon}>{kpi.icon}</div>
          <div style={styles.content}>
            <div style={styles.value}>{kpi.value}</div>
            <div style={styles.label}>{kpi.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  card: {
    background: '#1a1f2e',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  icon: {
    fontSize: '2.5rem'
  },
  content: {
    flex: 1
  },
  value: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '5px'
  },
  label: {
    fontSize: '0.85rem',
    color: '#8b92a7',
    textTransform: 'uppercase'
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    color: '#8b92a7'
  }
};

export default DashboardKPIs;

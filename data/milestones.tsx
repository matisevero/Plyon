
import React from 'react';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { BarChartIcon } from '../components/icons/BarChartIcon';
import { TableIcon } from '../components/icons/TableIcon';
import { UserIcon } from '../components/icons/UserIcon';
import { TargetIcon } from '../components/icons/TargetIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { GlobeIcon } from '../components/icons/GlobeIcon';
import { ActivityIcon } from '../components/icons/ActivityIcon';
import { BrainIcon } from '../components/icons/BrainIcon';
import type { TutorialStep } from '../types';

export const MILESTONES: Record<number, { id: string; steps: TutorialStep[] }> = {
    1: {
        id: 'milestone_1',
        steps: [
            {
                title: '¡Debut Registrado!',
                content: 'Has dado el primer paso. Plyon ha comenzado a calcular tus promedios básicos (Goles y Asistencias por partido).',
                icon: <TrendingUpIcon size={48} />,
            },
            {
                title: 'Tip de Profesional',
                content: "Para desbloquear la sección 'Duelos' en el futuro, recuerda agregar siempre los nombres de tus compañeros y rivales en '+ INFO EXTRA' al crear un partido.",
                icon: <UsersIcon size={48} />,
            }
        ]
    },
    3: {
        id: 'milestone_3',
        steps: [
            {
                title: 'Nivel: En Racha',
                content: 'Con 3 partidos, el motor de análisis empieza a funcionar. Ahora puedes ver tus tendencias de forma en la página de Estadísticas.',
                icon: <ActivityIcon size={48} />,
            },
            {
                title: 'Carrera en ascenso',
                content: 'Tus estadísticas empiezan a tomar forma. Sigue registrando partidos para que el sistema pueda definir tu perfil de jugador con precisión.',
                icon: <TrendingUpIcon size={48} />,
            }
        ]
    },
    5: {
        id: 'milestone_5',
        steps: [
            {
                title: 'Nivel: Promesa (Hito Importante)',
                content: '¡5 partidos! Has superado la barrera de entrada. Se han desbloqueado las funciones avanzadas de la aplicación.',
                icon: <BarChartIcon size={48} />,
            },
            {
                title: 'Desbloqueado: Duelos',
                content: "Visita la página 'Duelos'. Ahora puedes ver con quién tienes mejor química y quién es tu bestia negra.",
                icon: <UsersIcon size={48} />,
            },
            {
                title: 'Desbloqueado: Ranking Global',
                content: "Ya eres elegible para aparecer en las tablas de clasificación de la Comunidad si inicias sesión.",
                icon: <UserIcon size={48} />,
            }
        ]
    },
    10: {
        id: 'milestone_10',
        steps: [
            {
                title: 'Nivel: Profesional',
                content: '10 partidos oficiales. Tu perfil de jugador es sólido y las gráficas de radar en la sección "Tabla" son precisas.',
                icon: <TrophyIcon size={48} />,
            },
            {
                title: 'Desbloqueado: MODO CARRERA',
                content: 'Estás listo para la presión real. Se ha habilitado el acceso recomendado a la Copa del Mundo y Eliminatorias. ¿Podrás levantar la dorada?',
                icon: <GlobeIcon size={48} />,
            }
        ]
    },
    15: {
        id: 'milestone_15',
        steps: [
            {
                title: 'Nivel: Veterano',
                content: 'La consistencia es tu mejor arma. Has desbloqueado el análisis de "Evolución Anual" en la sección Tabla.',
                icon: <TableIcon size={48} />,
            },
            {
                title: 'Nuevos Objetivos',
                content: 'Es buen momento para ir a "Progreso" y establecer una meta de goles para terminar la temporada.',
                icon: <TargetIcon size={48} />,
            }
        ]
    }
};

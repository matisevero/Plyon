
export interface LeagueData {
    id: string;
    name: string;
    country: string;
    countryCode: string;
    logo: string;
    table: { pos: number; team: string; pts: number; status?: 'ucl' | 'uel' | 'rel' }[];
}

// Datos de la Temporada 23/24 (Para Recap 2024)
const LEAGUES_23_24: LeagueData[] = [
    {
        id: 'laliga',
        name: 'La Liga',
        country: '🇪🇸',
        countryCode: 'ESP',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/LaLiga_EA_Sports_2023_Vertical_Logo.svg/529px-LaLiga_EA_Sports_2023_Vertical_Logo.svg.png',
        table: [
            { pos: 1, team: 'Real Madrid', pts: 95, status: 'ucl' },
            { pos: 2, team: 'Barcelona', pts: 85, status: 'ucl' },
            { pos: 3, team: 'Girona', pts: 81, status: 'ucl' },
            { pos: 4, team: 'Atlético Madrid', pts: 76, status: 'ucl' },
            { pos: 5, team: 'Athletic Club', pts: 68, status: 'uel' },
            { pos: 6, team: 'Real Sociedad', pts: 60, status: 'uel' },
            { pos: 7, team: 'Real Betis', pts: 57 },
            { pos: 8, team: 'Villarreal', pts: 53 },
            { pos: 9, team: 'Valencia', pts: 49 },
            { pos: 10, team: 'Alavés', pts: 46 },
            { pos: 11, team: 'Osasuna', pts: 45 },
            { pos: 12, team: 'Getafe', pts: 43 },
            { pos: 13, team: 'Celta Vigo', pts: 41 },
            { pos: 14, team: 'Sevilla', pts: 41 },
            { pos: 15, team: 'Mallorca', pts: 40 },
            { pos: 16, team: 'Las Palmas', pts: 40 },
            { pos: 17, team: 'Rayo Vallecano', pts: 38 },
            { pos: 18, team: 'Cádiz', pts: 33, status: 'rel' },
            { pos: 19, team: 'Almería', pts: 21, status: 'rel' },
            { pos: 20, team: 'Granada', pts: 21, status: 'rel' }
        ]
    },
    {
        id: 'premier',
        name: 'Premier League',
        country: '🇬🇧',
        countryCode: 'ENG',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/1200px-Premier_League_Logo.svg.png',
        table: [
            { pos: 1, team: 'Man City', pts: 91, status: 'ucl' },
            { pos: 2, team: 'Arsenal', pts: 89, status: 'ucl' },
            { pos: 3, team: 'Liverpool', pts: 82, status: 'ucl' },
            { pos: 4, team: 'Aston Villa', pts: 68, status: 'ucl' },
            { pos: 5, team: 'Tottenham', pts: 66, status: 'uel' },
            { pos: 6, team: 'Chelsea', pts: 63, status: 'uel' },
            { pos: 7, team: 'Newcastle', pts: 60 },
            { pos: 8, team: 'Man Utd', pts: 60 },
            { pos: 9, team: 'West Ham', pts: 52 },
            { pos: 10, team: 'Crystal Palace', pts: 49 },
            { pos: 11, team: 'Brighton', pts: 48 },
            { pos: 12, team: 'Bournemouth', pts: 48 },
            { pos: 13, team: 'Fulham', pts: 47 },
            { pos: 14, team: 'Wolves', pts: 46 },
            { pos: 15, team: 'Everton', pts: 40 },
            { pos: 16, team: 'Brentford', pts: 39 },
            { pos: 17, team: 'Nottm Forest', pts: 32 },
            { pos: 18, team: 'Luton Town', pts: 26, status: 'rel' },
            { pos: 19, team: 'Burnley', pts: 24, status: 'rel' },
            { pos: 20, team: 'Sheffield Utd', pts: 16, status: 'rel' }
        ]
    },
    {
        id: 'seriea',
        name: 'Serie A',
        country: '🇮🇹',
        countryCode: 'ITA',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Serie_A_logo_2019.svg/1200px-Serie_A_logo_2019.svg.png',
        table: [
            { pos: 1, team: 'Inter', pts: 94, status: 'ucl' },
            { pos: 2, team: 'Milan', pts: 75, status: 'ucl' },
            { pos: 3, team: 'Juventus', pts: 71, status: 'ucl' },
            { pos: 4, team: 'Atalanta', pts: 69, status: 'ucl' },
            { pos: 5, team: 'Bologna', pts: 68, status: 'ucl' },
            { pos: 6, team: 'Roma', pts: 63, status: 'uel' },
            { pos: 7, team: 'Lazio', pts: 61, status: 'uel' },
            { pos: 8, team: 'Fiorentina', pts: 60 },
            { pos: 9, team: 'Torino', pts: 53 },
            { pos: 10, team: 'Napoli', pts: 53 },
            { pos: 11, team: 'Genoa', pts: 49 },
            { pos: 12, team: 'Monza', pts: 45 },
            { pos: 13, team: 'Verona', pts: 38 },
            { pos: 14, team: 'Lecce', pts: 38 },
            { pos: 15, team: 'Udinese', pts: 37 },
            { pos: 16, team: 'Cagliari', pts: 36 },
            { pos: 17, team: 'Empoli', pts: 36 },
            { pos: 18, team: 'Frosinone', pts: 35, status: 'rel' },
            { pos: 19, team: 'Sassuolo', pts: 30, status: 'rel' },
            { pos: 20, team: 'Salernitana', pts: 17, status: 'rel' }
        ]
    },
    {
        id: 'bundesliga',
        name: 'Bundesliga',
        country: '🇩🇪',
        countryCode: 'GER',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/df/Bundesliga_logo_%282017%29.svg/1200px-Bundesliga_logo_%282017%29.svg.png',
        table: [
            { pos: 1, team: 'B. Leverkusen', pts: 90, status: 'ucl' },
            { pos: 2, team: 'Stuttgart', pts: 73, status: 'ucl' },
            { pos: 3, team: 'Bayern Munich', pts: 72, status: 'ucl' },
            { pos: 4, team: 'RB Leipzig', pts: 65, status: 'ucl' },
            { pos: 5, team: 'B. Dortmund', pts: 63, status: 'ucl' }, 
            { pos: 6, team: 'E. Frankfurt', pts: 47, status: 'uel' },
            { pos: 7, team: 'Hoffenheim', pts: 46, status: 'uel' },
            { pos: 8, team: 'Heidenheim', pts: 42 },
            { pos: 9, team: 'Werder Bremen', pts: 42 },
            { pos: 10, team: 'Freiburg', pts: 42 },
            { pos: 11, team: 'Augsburg', pts: 39 },
            { pos: 12, team: 'Wolfsburg', pts: 37 },
            { pos: 13, team: 'Mainz 05', pts: 35 },
            { pos: 14, team: 'M. Gladbach', pts: 34 },
            { pos: 15, team: 'Union Berlin', pts: 33 },
            { pos: 16, team: 'Bochum', pts: 33, status: 'rel' },
            { pos: 17, team: 'FC Köln', pts: 27, status: 'rel' },
            { pos: 18, team: 'Darmstadt', pts: 17, status: 'rel' }
        ]
    },
    {
        id: 'ligue1',
        name: 'Ligue 1',
        country: '🇫🇷',
        countryCode: 'FRA',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Ligue_1_McDonald%27s_logo.svg/1200px-Ligue_1_McDonald%27s_logo.svg.png',
        table: [
            { pos: 1, team: 'PSG', pts: 76, status: 'ucl' },
            { pos: 2, team: 'Monaco', pts: 67, status: 'ucl' },
            { pos: 3, team: 'Brest', pts: 61, status: 'ucl' },
            { pos: 4, team: 'Lille', pts: 59, status: 'ucl' },
            { pos: 5, team: 'Nice', pts: 55, status: 'uel' },
            { pos: 6, team: 'Lyon', pts: 53, status: 'uel' },
            { pos: 7, team: 'Lens', pts: 51 },
            { pos: 8, team: 'Marseille', pts: 50 },
            { pos: 9, team: 'Reims', pts: 47 },
            { pos: 10, team: 'Rennes', pts: 46 },
            { pos: 11, team: 'Toulouse', pts: 43 },
            { pos: 12, team: 'Montpellier', pts: 41 },
            { pos: 13, team: 'Strasbourg', pts: 39 },
            { pos: 14, team: 'Nantes', pts: 33 },
            { pos: 15, team: 'Le Havre', pts: 32 },
            { pos: 16, team: 'Metz', pts: 29, status: 'rel' },
            { pos: 17, team: 'Lorient', pts: 29, status: 'rel' },
            { pos: 18, team: 'Clermont', pts: 25, status: 'rel' }
        ]
    }
];

// Datos de la Temporada 24/25 (Proyección Actual)
const LEAGUES_24_25: LeagueData[] = [
    {
        id: 'laliga',
        name: 'La Liga',
        country: '🇪🇸',
        countryCode: 'ESP',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/LaLiga_EA_Sports_2023_Vertical_Logo.svg/529px-LaLiga_EA_Sports_2023_Vertical_Logo.svg.png',
        table: [
            { pos: 1, team: 'Barcelona', pts: 92, status: 'ucl' },
            { pos: 2, team: 'Real Madrid', pts: 86, status: 'ucl' },
            { pos: 3, team: 'Atlético Madrid', pts: 78, status: 'ucl' },
            { pos: 4, team: 'Athletic Club', pts: 70, status: 'ucl' },
            { pos: 5, team: 'Villarreal', pts: 65, status: 'uel' },
            { pos: 6, team: 'Real Sociedad', pts: 60, status: 'uel' },
            { pos: 7, team: 'Real Betis', pts: 56 },
            { pos: 8, team: 'Girona', pts: 52 },
            { pos: 9, team: 'Mallorca', pts: 49 },
            { pos: 10, team: 'Osasuna', pts: 47 },
            { pos: 11, team: 'Celta Vigo', pts: 45 },
            { pos: 12, team: 'Sevilla', pts: 43 },
            { pos: 13, team: 'Rayo Vallecano', pts: 40 },
            { pos: 14, team: 'Alavés', pts: 39 },
            { pos: 15, team: 'Las Palmas', pts: 37 },
            { pos: 16, team: 'Getafe', pts: 35 },
            { pos: 17, team: 'Leganés', pts: 34 },
            { pos: 18, team: 'Valencia', pts: 30, status: 'rel' },
            { pos: 19, team: 'Espanyol', pts: 28, status: 'rel' },
            { pos: 20, team: 'Valladolid', pts: 22, status: 'rel' }
        ]
    },
    {
        id: 'premier',
        name: 'Premier League',
        country: '🇬🇧',
        countryCode: 'ENG',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/1200px-Premier_League_Logo.svg.png',
        table: [
            { pos: 1, team: 'Liverpool', pts: 90, status: 'ucl' },
            { pos: 2, team: 'Arsenal', pts: 86, status: 'ucl' },
            { pos: 3, team: 'Man City', pts: 82, status: 'ucl' },
            { pos: 4, team: 'Chelsea', pts: 72, status: 'ucl' },
            { pos: 5, team: 'Newcastle', pts: 68, status: 'uel' },
            { pos: 6, team: 'Aston Villa', pts: 65, status: 'uel' },
            { pos: 7, team: 'Tottenham', pts: 62 },
            { pos: 8, team: 'Nottm Forest', pts: 58 },
            { pos: 9, team: 'Brighton', pts: 55 },
            { pos: 10, team: 'Fulham', pts: 52 },
            { pos: 11, team: 'Brentford', pts: 48 },
            { pos: 12, team: 'Man Utd', pts: 46 },
            { pos: 13, team: 'Bournemouth', pts: 44 },
            { pos: 14, team: 'West Ham', pts: 41 },
            { pos: 15, team: 'Crystal Palace', pts: 39 },
            { pos: 16, team: 'Everton', pts: 36 },
            { pos: 17, team: 'Wolves', pts: 33 },
            { pos: 18, team: 'Ipswich', pts: 29, status: 'rel' },
            { pos: 19, team: 'Leicester', pts: 25, status: 'rel' },
            { pos: 20, team: 'Southampton', pts: 18, status: 'rel' }
        ]
    },
    {
        id: 'seriea',
        name: 'Serie A',
        country: '🇮🇹',
        countryCode: 'ITA',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Serie_A_logo_2019.svg/1200px-Serie_A_logo_2019.svg.png',
        table: [
            { pos: 1, team: 'Napoli', pts: 88, status: 'ucl' },
            { pos: 2, team: 'Inter', pts: 85, status: 'ucl' },
            { pos: 3, team: 'Atalanta', pts: 80, status: 'ucl' },
            { pos: 4, team: 'Juventus', pts: 76, status: 'ucl' },
            { pos: 5, team: 'Lazio', pts: 72, status: 'ucl' },
            { pos: 6, team: 'Fiorentina', pts: 68, status: 'uel' },
            { pos: 7, team: 'Milan', pts: 65, status: 'uel' },
            { pos: 8, team: 'Bologna', pts: 58 },
            { pos: 9, team: 'Roma', pts: 55 },
            { pos: 10, team: 'Torino', pts: 52 },
            { pos: 11, team: 'Udinese', pts: 48 },
            { pos: 12, team: 'Empoli', pts: 45 },
            { pos: 13, team: 'Genoa', pts: 42 },
            { pos: 14, team: 'Parma', pts: 39 },
            { pos: 15, team: 'Verona', pts: 38 },
            { pos: 16, team: 'Como', pts: 36 },
            { pos: 17, team: 'Cagliari', pts: 34 },
            { pos: 18, team: 'Lecce', pts: 31, status: 'rel' },
            { pos: 19, team: 'Monza', pts: 28, status: 'rel' },
            { pos: 20, team: 'Venezia', pts: 22, status: 'rel' }
        ]
    },
    {
        id: 'bundesliga',
        name: 'Bundesliga',
        country: '🇩🇪',
        countryCode: 'GER',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/df/Bundesliga_logo_%282017%29.svg/1200px-Bundesliga_logo_%282017%29.svg.png',
        table: [
            { pos: 1, team: 'Bayern Munich', pts: 86, status: 'ucl' },
            { pos: 2, team: 'B. Leverkusen', pts: 78, status: 'ucl' },
            { pos: 3, team: 'RB Leipzig', pts: 72, status: 'ucl' },
            { pos: 4, team: 'E. Frankfurt', pts: 66, status: 'ucl' },
            { pos: 5, team: 'B. Dortmund', pts: 64, status: 'ucl' }, 
            { pos: 6, team: 'Freiburg', pts: 58, status: 'uel' },
            { pos: 7, team: 'Stuttgart', pts: 55, status: 'uel' },
            { pos: 8, team: 'Mainz 05', pts: 48 },
            { pos: 9, team: 'W. Bremen', pts: 45 },
            { pos: 10, team: 'M. Gladbach', pts: 42 },
            { pos: 11, team: 'Union Berlin', pts: 40 },
            { pos: 12, team: 'Augsburg', pts: 38 },
            { pos: 13, team: 'Heidenheim', pts: 36 },
            { pos: 14, team: 'Wolfsburg', pts: 34 },
            { pos: 15, team: 'Hoffenheim', pts: 32 },
            { pos: 16, team: 'St. Pauli', pts: 30, status: 'rel' }, // Playoff
            { pos: 17, team: 'Kiel', pts: 25, status: 'rel' },
            { pos: 18, team: 'Bochum', pts: 18, status: 'rel' }
        ]
    },
    {
        id: 'ligue1',
        name: 'Ligue 1',
        country: '🇫🇷',
        countryCode: 'FRA',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Ligue_1_McDonald%27s_logo.svg/1200px-Ligue_1_McDonald%27s_logo.svg.png',
        table: [
            { pos: 1, team: 'PSG', pts: 82, status: 'ucl' },
            { pos: 2, team: 'Monaco', pts: 75, status: 'ucl' },
            { pos: 3, team: 'Marseille', pts: 70, status: 'ucl' },
            { pos: 4, team: 'Lille', pts: 66, status: 'ucl' }, 
            { pos: 5, team: 'Lens', pts: 60, status: 'uel' },
            { pos: 6, team: 'Lyon', pts: 58, status: 'uel' },
            { pos: 7, team: 'Nice', pts: 54 },
            { pos: 8, team: 'Auxerre', pts: 48 },
            { pos: 9, team: 'Reims', pts: 46 },
            { pos: 10, team: 'Toulouse', pts: 44 },
            { pos: 11, team: 'Strasbourg', pts: 42 },
            { pos: 12, team: 'Brest', pts: 39 },
            { pos: 13, team: 'Rennes', pts: 38 },
            { pos: 14, team: 'Nantes', pts: 35 },
            { pos: 15, team: 'Angers', pts: 33 },
            { pos: 16, team: 'Saint-Étienne', pts: 30, status: 'rel' }, // Playoff
            { pos: 17, team: 'Le Havre', pts: 26, status: 'rel' },
            { pos: 18, team: 'Montpellier', pts: 20, status: 'rel' }
        ]
    }
];

// Mapping year to dataset
const LEAGUES_HISTORY: Record<string, LeagueData[]> = {
    '2024': LEAGUES_23_24,
    '2025': LEAGUES_24_25
};

export const getLeaguesForYear = (year: number | string): LeagueData[] => {
    return LEAGUES_HISTORY[year.toString()] || LEAGUES_24_25; // Default to latest if unknown
};

// Default export for backward compatibility with existing imports, pointing to latest
export const LEAGUES_DATA = LEAGUES_24_25;

export const calculateProjectedPoints = (matchesPlayed: number, points: number): number => {
    if (matchesPlayed === 0) return 0;
    const ppg = points / matchesPlayed;
    // Project to a standard 38-game season (standard for comparison across most major leagues)
    return Math.round(ppg * 38);
};

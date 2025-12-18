
import type { Match, Goal, CustomAchievement, AIInteraction, PlayerProfileData, Tournament } from '../types';

interface InitialData {
    matches: Match[];
    goals: Goal[];
    customAchievements: CustomAchievement[];
    aiInteractions: AIInteraction[];
    playerProfile: PlayerProfileData;
    tournaments: Tournament[];
}

export const initialData: InitialData = {
  "matches": [],
  "goals": [],
  "customAchievements": [],
  "aiInteractions": [],
  "tournaments": [
    {
      "id": "tourney1",
      "name": "Liga de los Martes",
      "matchDuration": 50,
      "playersPerSide": 5,
      "icon": "🏆",
      "color": "#FFC107"
    },
    {
      "id": "tourney2",
      "name": "Copa de Verano",
      "matchDuration": 60,
      "playersPerSide": 7,
      "icon": "☀️",
      "color": "#2196F3"
    },
     {
      "id": "tourney3",
      "name": "Amistoso",
      "matchDuration": 0,
      "playersPerSide": 5,
      "icon": "🤝",
      "color": "#9E9E9E"
    }
  ],
  "playerProfile": {
      "name": "Jugador",
      "photo": "",
      "dob": "",
      "weight": 0,
      "height": 0,
      "favoriteTeam": ""
  }
};

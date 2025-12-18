
import { useMemo, useCallback } from 'react';
import { useData } from '../contexts/DataContext';

export const useTutorial = (pageId: string) => {
  const { playerProfile, updatePlayerProfile } = useData();

  const isTutorialSeen = useMemo(() => {
    return playerProfile?.tutorialsSeen?.[pageId] ?? false;
  }, [playerProfile, pageId]);

  const markTutorialAsSeen = useCallback(() => {
    if (!isTutorialSeen) {
        updatePlayerProfile({
            tutorialsSeen: {
                ...(playerProfile?.tutorialsSeen || {}),
                [pageId]: true
            }
        });
    }
  }, [playerProfile, pageId, updatePlayerProfile, isTutorialSeen]);

  return {
    isTutorialSeen,
    markTutorialAsSeen,
  };
};

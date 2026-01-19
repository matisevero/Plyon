
import { useMemo, useCallback } from 'react';
import { useData } from '../contexts/DataContext';

export const useTutorial = (pageId: string) => {
  const { playerProfile, updatePlayerProfile, isOnboardingComplete } = useData();

  const isTutorialSeen = useMemo(() => {
    // If onboarding is NOT complete, assume nothing is seen yet to be safe, 
    // unless explicitly marked in the future.
    // If onboarding IS complete, check the profile.
    // Also, use optional chaining and nullish coalescing to be safe against empty profiles.
    return playerProfile?.tutorialsSeen?.[pageId] ?? false;
  }, [playerProfile, pageId]);

  const markTutorialAsSeen = useCallback(() => {
    if (!isTutorialSeen) {
        const currentSeen = playerProfile?.tutorialsSeen || {};
        updatePlayerProfile({
            tutorialsSeen: {
                ...currentSeen,
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

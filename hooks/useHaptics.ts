
import { useCallback } from 'react';

export const useHaptics = () => {
  // Helper to check support and trigger
  const trigger = useCallback((pattern: number | number[]) => {
    // Check if navigator.vibrate exists and if user hasn't explicitly disabled it (future proofing)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        // Simple feature detection or wrap in try-catch for browsers that might throw
        navigator.vibrate(pattern);
      } catch (e) {
        // Fail silently if vibration is blocked or not supported in specific context
      }
    }
  }, []);

  return {
    // UI Feedback (Buttons, Toggles, Tabs)
    light: () => trigger(10), // Very short, crisp tap
    medium: () => trigger(20), // Noticeable tap
    heavy: () => trigger(40), // Strong button press or delete action
    
    // Status Feedback
    success: () => trigger([30, 50, 30]), // "Ta-da!" rhythm
    warning: () => trigger([30, 50]), // Double tap
    error: () => trigger([50, 100, 50, 100]), // Long buzzes
    
    // Game Events
    goal: () => trigger([50, 50, 50, 50, 100]), // Exciting pattern
  };
};

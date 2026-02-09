/**
 * @fileoverview Hook for triggering haptic feedback.
 * Provides cross-platform haptic feedback for mobile devices.
 */

import { useCallback } from 'react';
import { HAPTIC_PATTERNS } from '../../constants';
import type { HapticPattern } from '../../types';

interface UseHapticFeedbackResult {
  /** Trigger haptic feedback with the specified pattern */
  triggerHaptic: (pattern?: HapticPattern) => void;
  /** Check if haptic feedback is supported */
  isSupported: boolean;
}

/**
 * Provides haptic feedback functionality for mobile devices.
 * Falls back gracefully on unsupported devices.
 * 
 * @example
 * const { triggerHaptic } = useHapticFeedback();
 * triggerHaptic('heavy'); // Strong vibration for important actions
 */
export function useHapticFeedback(): UseHapticFeedbackResult {
  const isSupported = 'vibrate' in navigator;

  const triggerHaptic = useCallback((pattern: HapticPattern = 'medium') => {
    if (isSupported) {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    }
  }, [isSupported]);

  return {
    triggerHaptic,
    isSupported,
  };
}

/**
 * @fileoverview Hook for managing unboxing screen navigation state.
 * Provides screen state and transition methods for the Collect Room flow.
 */

import { useState, useCallback } from 'react';
import type { UnboxingScreen } from '../../types';

interface UseScreenStateResult {
  /** Current screen in the unboxing flow */
  screen: UnboxingScreen;
  /** Set the current screen */
  setScreen: (screen: UnboxingScreen) => void;
  /** Transition to sealed (home) screen */
  goToSealed: () => void;
  /** Transition to emerge (card rising) screen */
  goToEmerge: () => void;
  /** Transition to reveal screen */
  goToReveal: () => void;
  /** Transition to golden card reveal screen */
  goToGolden: () => void;
  /** Transition to collection view screen */
  goToCollection: () => void;
}

/**
 * Manages screen navigation state for the Collect Room unboxing flow.
 * 
 * @param initialScreen - Initial screen state (defaults to 'sealed')
 */
export function useScreenState(initialScreen: UnboxingScreen = 'sealed'): UseScreenStateResult {
  const [screen, setScreen] = useState<UnboxingScreen>(initialScreen);

  const goToSealed = useCallback(() => setScreen('sealed'), []);
  const goToEmerge = useCallback(() => setScreen('emerge'), []);
  const goToReveal = useCallback(() => setScreen('reveal'), []);
  const goToGolden = useCallback(() => setScreen('golden'), []);
  const goToCollection = useCallback(() => setScreen('collection'), []);

  return {
    screen,
    setScreen,
    goToSealed,
    goToEmerge,
    goToReveal,
    goToGolden,
    goToCollection,
  };
}

/**
 * @fileoverview Tests for useRealtimeReveals hook
 * @todo Implement tests for realtime reveals functionality
 */

import { describe, it, expect } from 'vitest';

describe('useRealtimeReveals', () => {
  describe('subscription', () => {
    it.todo('should subscribe to reveals channel');
    it.todo('should unsubscribe on unmount');
    it.todo('should not subscribe when not authenticated');
  });

  describe('event handling', () => {
    it.todo('should call handler on INSERT event');
    it.todo('should map payload to CollectCard');
    it.todo('should ignore events for other users');
  });

  describe('reconnection', () => {
    it.todo('should handle channel reconnection');
    it.todo('should resubscribe after auth change');
  });
});

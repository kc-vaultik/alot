/**
 * @fileoverview Hook for fetching user's trivia attempt status for purchase gate.
 * @module features/rooms/hooks/data/useTriviaAttempts
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TriviaAttemptStatus {
  id: string;
  user_id: string;
  room_id: string;
  attempts_used: number;
  last_failed_at: string | null;
  unlocked_at: string | null;
  created_at: string;
}

/**
 * Fetch user's trivia attempt status for a room
 */
export function useTriviaAttempts(roomId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['trivia-attempts', roomId, user?.id],
    queryFn: async () => {
      if (!roomId || !user) return null;
      
      const { data, error } = await supabase
        .from('room_trivia_attempts')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as TriviaAttemptStatus | null;
    },
    enabled: !!roomId && !!user,
  });
}

/**
 * Check if user has unlocked purchase for a room
 */
export function useIsPurchaseUnlocked(roomId: string | undefined) {
  const { data: attempts, isLoading } = useTriviaAttempts(roomId);
  
  return {
    isUnlocked: attempts?.unlocked_at != null,
    attemptsUsed: attempts?.attempts_used ?? 0,
    attemptsRemaining: Math.max(0, 3 - (attempts?.attempts_used ?? 0)),
    cooldownEndsAt: attempts?.last_failed_at && attempts.attempts_used >= 3
      ? new Date(new Date(attempts.last_failed_at).getTime() + 60 * 60 * 1000)
      : null,
    isLoading,
  };
}

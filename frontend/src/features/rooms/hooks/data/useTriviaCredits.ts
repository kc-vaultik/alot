/**
 * @fileoverview Hooks for fetching and managing Trivia Credits.
 * @module features/rooms/hooks/data/useTriviaCredits
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const TRIVIA_CREDITS_QUERY_KEY = 'trivia-credits';
export const LOT_TRIVIA_STATS_QUERY_KEY = 'lot-trivia-stats';

export interface TriviaCreditsData {
  credits: number;
  lifetime_earned: number;
  daily_earned: number;
  daily_limit: number;
  can_earn_more: boolean;
}

export interface LotTriviaStats {
  questions_answered: number;
  correct_answers: number;
  max_questions: number;
  can_answer_more: boolean;
  trivia_tickets: number;
  max_free_tickets: number;
  can_get_more_tickets: boolean;
  user_credits: number;
  credits_per_ticket: number;
  affordable_tickets: number;
}

/**
 * Fetch the current user's Trivia Credits balance and stats
 */
export function useMyTriviaCredits() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: [TRIVIA_CREDITS_QUERY_KEY, user?.id],
    queryFn: async (): Promise<TriviaCreditsData | null> => {
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_my_trivia_credits');
      
      if (error) throw error;
      
      const result = data as unknown as { success: boolean; error?: string } & TriviaCreditsData;
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch trivia credits');
      }
      
      return {
        credits: result.credits,
        lifetime_earned: result.lifetime_earned,
        daily_earned: result.daily_earned,
        daily_limit: result.daily_limit,
        can_earn_more: result.can_earn_more,
      };
    },
    enabled: !authLoading && !!user,
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Fetch trivia stats for a specific lot (questions answered, free tickets, etc.)
 */
export function useLotTriviaStats(roomId: string | undefined) {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: [LOT_TRIVIA_STATS_QUERY_KEY, roomId, user?.id],
    queryFn: async (): Promise<LotTriviaStats | null> => {
      if (!user || !roomId) return null;

      const { data, error } = await supabase.rpc('get_lot_trivia_stats', {
        p_room_id: roomId,
      });
      
      if (error) throw error;
      
      const result = data as unknown as { success: boolean; error?: string } & LotTriviaStats;
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lot trivia stats');
      }
      
      return {
        questions_answered: result.questions_answered,
        correct_answers: result.correct_answers,
        max_questions: result.max_questions,
        can_answer_more: result.can_answer_more,
        trivia_tickets: result.trivia_tickets,
        max_free_tickets: result.max_free_tickets,
        can_get_more_tickets: result.can_get_more_tickets,
        user_credits: result.user_credits,
        credits_per_ticket: result.credits_per_ticket,
        affordable_tickets: result.affordable_tickets,
      };
    },
    enabled: !authLoading && !!user && !!roomId,
    staleTime: 5000, // 5 seconds
  });
}

/**
 * Fetch user's trivia entry for a specific lot
 */
export function useMyTriviaEntry(roomId: string | undefined) {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['my-trivia-entry', roomId, user?.id],
    queryFn: async () => {
      if (!user || !roomId) return null;

      const { data, error } = await supabase.rpc('get_my_trivia_entry', {
        p_room_id: roomId,
      });
      
      if (error) throw error;
      
      const result = data as unknown as {
        success: boolean;
        error?: string;
        has_entry: boolean;
        trivia_tickets: number;
        questions_answered: number;
        max_questions: number;
        max_free_tickets: number;
        can_answer_more: boolean;
      };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch trivia entry');
      }
      
      return result;
    },
    enabled: !authLoading && !!user && !!roomId,
    staleTime: 5000,
  });
}

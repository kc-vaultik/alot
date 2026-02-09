/**
 * @fileoverview Mutation hook for earning Trivia Credits by answering questions.
 * @module features/rooms/hooks/mutations/useEarnTriviaCredits
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TRIVIA_CREDITS_QUERY_KEY, LOT_TRIVIA_STATS_QUERY_KEY } from '../data/useTriviaCredits';

interface EarnTriviaCreditsParams {
  roomId: string;
  questionId: string;
  selectedOption: string;
  source?: 'TRIVIA_GATE' | 'KNOWLEDGE_BOOST';
}

interface EarnTriviaCreditsResponse {
  success: boolean;
  error?: string;
  is_correct: boolean;
  correct_option: string;
  credits_earned: number;
  new_balance: number;
  daily_earned: number;
  daily_limit: number;
  lot_questions_answered: number;
  lot_questions_limit: number;
}

/**
 * Mutation hook for earning Trivia Credits by answering trivia questions.
 * Available to ALL authenticated users, not just paying customers.
 */
export function useEarnTriviaCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      roomId, 
      questionId, 
      selectedOption,
      source = 'KNOWLEDGE_BOOST'
    }: EarnTriviaCreditsParams): Promise<EarnTriviaCreditsResponse> => {
      const { data, error } = await supabase.rpc('earn_trivia_credits', {
        p_room_id: roomId,
        p_question_id: questionId,
        p_selected_option: selectedOption,
        p_source: source,
      });

      if (error) throw error;
      
      const result = data as unknown as EarnTriviaCreditsResponse;
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit answer');
      }
      
      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate trivia credits queries
      queryClient.invalidateQueries({ queryKey: [TRIVIA_CREDITS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [LOT_TRIVIA_STATS_QUERY_KEY, variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['my-trivia-entry', variables.roomId] });
      
      // Show feedback
      if (data.is_correct) {
        if (data.credits_earned > 0) {
          toast.success(`Correct! +${data.credits_earned} Trivia Credit${data.credits_earned > 1 ? 's' : ''}!`, {
            description: `Balance: ${data.new_balance} TC`,
          });
        } else {
          toast.success('Correct!', {
            description: 'Daily credit limit reached',
          });
        }
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to submit answer', { description: error.message });
    },
  });
}

/**
 * @fileoverview Mutation hook for attempting trivia to unlock purchase.
 * @module features/rooms/hooks/mutations/useAttemptTrivia
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROOM_QUERY_KEYS } from '../../constants';

interface AttemptTriviaParams {
  roomId: string;
  questionId: string;
  selectedOption: string;
}

interface AttemptTriviaResponse {
  success: boolean;
  error?: string;
  is_correct?: boolean;
  correct_option?: string;
  can_purchase?: boolean;
  already_unlocked?: boolean;
  attempts_remaining?: number;
  cooldown_ends_at?: string;
}

/**
 * Mutation hook for attempting a trivia question to unlock purchase
 */
export function useAttemptTrivia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, questionId, selectedOption }: AttemptTriviaParams): Promise<AttemptTriviaResponse> => {
      const { data, error } = await supabase.rpc('attempt_trivia_for_purchase', {
        p_room_id: roomId,
        p_question_id: questionId,
        p_selected_option: selectedOption,
      });

      if (error) throw error;
      
      const result = data as unknown as AttemptTriviaResponse;
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
      
      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate trivia attempts to refresh the unlock status
      queryClient.invalidateQueries({ queryKey: ['trivia-attempts', variables.roomId] });
      
      if (data.can_purchase) {
        queryClient.invalidateQueries({ queryKey: [ROOM_QUERY_KEYS.MY_ROOM_ENTRY] });
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to submit answer', { description: error.message });
    },
  });
}

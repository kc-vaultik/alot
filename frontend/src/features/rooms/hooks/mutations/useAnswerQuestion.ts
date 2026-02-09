/**
 * @fileoverview Mutation hook for submitting trivia question answers.
 * @module features/rooms/hooks/mutations/useAnswerQuestion
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnswerQuestionParams {
  roomId: string;
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D';
}

interface AnswerQuestionResult {
  success: boolean;
  error?: string;
  is_correct?: boolean;
  correct_option?: string;
  bonus_tickets?: number;
  new_total_tickets?: number;
}

/**
 * Submit an answer to a trivia question
 */
export function useAnswerQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, questionId, selectedOption }: AnswerQuestionParams) => {
      const { data, error } = await supabase.rpc('answer_trivia_question', {
        p_room_id: roomId,
        p_question_id: questionId,
        p_selected_option: selectedOption,
      });

      if (error) throw error;
      
      const result = data as unknown as AnswerQuestionResult;
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit answer');
      }
      
      return result;
    },
    onSuccess: (result, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-question-answers', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-leaderboard', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['my-room-entry', variables.roomId] });
      
      if (result.is_correct && result.bonus_tickets) {
        toast.success(`Correct! +${result.bonus_tickets} bonus ticket${result.bonus_tickets > 1 ? 's' : ''}!`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

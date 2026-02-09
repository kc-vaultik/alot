/**
 * @fileoverview Hooks for fetching product trivia questions and user answers.
 * @module features/rooms/hooks/data/useProductQuestions
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductQuestion {
  id: string;
  product_class_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  bonus_tickets: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface UserQuestionAnswer {
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  bonus_tickets_awarded: number;
}

/**
 * Fetch questions for a product (max 5)
 */
export function useProductQuestions(productClassId: string | undefined) {
  return useQuery({
    queryKey: ['product-questions', productClassId],
    queryFn: async () => {
      if (!productClassId) return [];
      
      const { data, error } = await supabase
        .from('product_questions')
        .select('*')
        .eq('product_class_id', productClassId)
        .eq('is_active', true)
        .order('display_order')
        .limit(5);
      
      if (error) throw error;
      return data as ProductQuestion[];
    },
    enabled: !!productClassId,
  });
}

/**
 * Fetch user's answers for a specific room
 */
export function useUserQuestionAnswers(roomId: string | undefined) {
  return useQuery({
    queryKey: ['user-question-answers', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from('user_question_answers')
        .select('question_id, selected_option, is_correct, bonus_tickets_awarded')
        .eq('room_id', roomId);
      
      if (error) throw error;
      return data as UserQuestionAnswer[];
    },
    enabled: !!roomId,
  });
}

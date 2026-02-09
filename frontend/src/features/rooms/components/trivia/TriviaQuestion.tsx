/**
 * @fileoverview Single trivia question card component.
 * @module features/rooms/components/trivia/TriviaQuestion
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductQuestion, UserQuestionAnswer } from '../../hooks/data/useProductQuestions';
import { useAnswerQuestion } from '../../hooks/mutations/useAnswerQuestion';

interface TriviaQuestionProps {
  question: ProductQuestion;
  roomId: string;
  userAnswer?: UserQuestionAnswer;
  questionNumber: number;
}

type OptionKey = 'A' | 'B' | 'C' | 'D';

export function TriviaQuestion({ question, roomId, userAnswer, questionNumber }: TriviaQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [showResult, setShowResult] = useState(!!userAnswer);
  const [result, setResult] = useState<{ isCorrect: boolean; correctOption: string } | null>(
    userAnswer ? { isCorrect: userAnswer.is_correct, correctOption: '' } : null
  );
  
  const answerMutation = useAnswerQuestion();
  const isAnswered = !!userAnswer || showResult;

  const options: { key: OptionKey; text: string }[] = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ];

  const handleSelectOption = async (optionKey: OptionKey) => {
    if (isAnswered || answerMutation.isPending) return;
    
    setSelectedOption(optionKey);
    
    try {
      const response = await answerMutation.mutateAsync({
        roomId,
        questionId: question.id,
        selectedOption: optionKey,
      });
      
      setResult({
        isCorrect: response.is_correct || false,
        correctOption: response.correct_option || '',
      });
      setShowResult(true);
    } catch {
      setSelectedOption(null);
    }
  };

  const getOptionState = (optionKey: OptionKey) => {
    if (!showResult) {
      return selectedOption === optionKey ? 'selected' : 'default';
    }
    
    const userSelected = userAnswer?.selected_option || selectedOption;
    const correctOption = result?.correctOption || question.correct_option;
    
    if (optionKey === correctOption) return 'correct';
    if (optionKey === userSelected && optionKey !== correctOption) return 'incorrect';
    return 'disabled';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: questionNumber * 0.1 }}
      className="relative"
    >
      {/* Question Card */}
      <div className="bg-card/80 backdrop-blur-sm border-2 border-border/50 rounded-2xl p-4 sm:p-5">
        {/* Question Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{questionNumber}</span>
          </div>
          <p className="text-foreground font-medium leading-relaxed">{question.question_text}</p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map(({ key, text }) => {
            const state = getOptionState(key);
            
            return (
              <motion.button
                key={key}
                onClick={() => handleSelectOption(key)}
                disabled={isAnswered || answerMutation.isPending}
                whileHover={!isAnswered ? { scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
                className={cn(
                  'relative flex items-center gap-3 p-4 rounded-xl border-3 transition-all duration-200',
                  'text-left font-medium',
                  // Default state
                  state === 'default' && 'bg-background/50 border-border/70 hover:border-primary/50 hover:bg-primary/5',
                  // Selected (pending)
                  state === 'selected' && 'bg-primary/10 border-primary',
                  // Correct answer
                  state === 'correct' && 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
                  // Incorrect answer
                  state === 'incorrect' && 'bg-red-500/20 border-red-500 text-red-400',
                  // Disabled
                  state === 'disabled' && 'bg-muted/30 border-border/30 text-muted-foreground opacity-60',
                  // General disabled
                  (isAnswered || answerMutation.isPending) && 'cursor-default'
                )}
              >
                {/* Option Letter Badge */}
                <span className={cn(
                  'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold',
                  state === 'correct' && 'bg-emerald-500 text-white',
                  state === 'incorrect' && 'bg-red-500 text-white',
                  state === 'selected' && 'bg-primary text-primary-foreground',
                  state === 'default' && 'bg-muted text-muted-foreground',
                  state === 'disabled' && 'bg-muted/50 text-muted-foreground/50'
                )}>
                  {state === 'correct' ? <Check className="w-4 h-4" /> : 
                   state === 'incorrect' ? <X className="w-4 h-4" /> : key}
                </span>
                
                {/* Option Text */}
                <span className="flex-1">{text}</span>

                {/* Correct Answer Indicator */}
                {state === 'correct' && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Odds Boosted Badge */}
        <AnimatePresence>
          {showResult && result?.isCorrect && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-4 flex items-center justify-center gap-2 py-2 px-4 
                         bg-gradient-to-r from-emerald-500/20 via-emerald-400/20 to-emerald-500/20
                         border border-emerald-500/50 rounded-xl"
            >
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-emerald-400">
                ODDS BOOSTED! +{question.bonus_tickets} ticket{question.bonus_tickets > 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wrong Answer Message */}
        <AnimatePresence>
          {showResult && result && !result.isCorrect && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center justify-center gap-2 py-2 px-4 
                         bg-muted/30 border border-border/50 rounded-xl"
            >
              <span className="text-muted-foreground text-sm">
                Not quite! The correct answer is shown above.
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * @fileoverview Trivia section container component for lot detail pages.
 * @module features/rooms/components/trivia/TriviaSection
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductQuestions, useUserQuestionAnswers } from '../../hooks/data/useProductQuestions';
import { TriviaQuestion } from './TriviaQuestion';

interface TriviaSectionProps {
  roomId: string;
  productClassId: string;
  className?: string;
}

export function TriviaSection({ roomId, productClassId, className }: TriviaSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { data: questions, isLoading: questionsLoading } = useProductQuestions(productClassId);
  const { data: userAnswers, isLoading: answersLoading } = useUserQuestionAnswers(roomId);

  const isLoading = questionsLoading || answersLoading;
  
  // Don't render if no questions
  if (!isLoading && (!questions || questions.length === 0)) {
    return null;
  }

  const answeredCount = userAnswers?.length || 0;
  const totalQuestions = questions?.length || 0;
  const correctCount = userAnswers?.filter(a => a.is_correct).length || 0;
  const totalBonusTickets = userAnswers?.reduce((sum, a) => sum + a.bonus_tickets_awarded, 0) || 0;
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  // Create a map of user answers by question ID
  const answerMap = new Map(userAnswers?.map(a => [a.question_id, a]));

  return (
    <div className={cn('w-full', className)}>
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 
                   bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10
                   border-2 border-primary/30 rounded-2xl
                   hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              BOOST YOUR ODDS!
              {totalBonusTickets > 0 && (
                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                  +{totalBonusTickets} tickets
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {allAnswered 
                ? `Completed! ${correctCount}/${totalQuestions} correct`
                : `Answer trivia to earn bonus tickets • ${answeredCount}/${totalQuestions}`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Indicator */}
          <div className="hidden sm:flex items-center gap-1.5">
            {Array.from({ length: totalQuestions }).map((_, i) => {
              const isAnswered = i < answeredCount;
              const answer = userAnswers?.[i];
              const isCorrect = answer?.is_correct;
              
              return (
                <div
                  key={i}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-colors',
                    !isAnswered && 'bg-muted',
                    isAnswered && isCorrect && 'bg-emerald-500',
                    isAnswered && !isCorrect && 'bg-red-500/50'
                  )}
                />
              );
            })}
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Questions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">
              {isLoading ? (
                // Loading skeleton
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-muted/30 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {questions?.map((question, index) => (
                    <TriviaQuestion
                      key={question.id}
                      question={question}
                      roomId={roomId}
                      userAnswer={answerMap.get(question.id)}
                      questionNumber={index + 1}
                    />
                  ))}

                  {/* Completion Card */}
                  {allAnswered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20
                                 border-2 border-primary/30 rounded-2xl p-6 text-center"
                    >
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        <span className="text-lg font-bold text-foreground">Trivia Complete!</span>
                      </div>
                      <p className="text-muted-foreground mb-3">
                        You answered {correctCount} out of {totalQuestions} correctly
                      </p>
                      {totalBonusTickets > 0 && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 
                                        bg-emerald-500/20 border border-emerald-500/50 rounded-xl">
                          <Zap className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-emerald-400">
                            +{totalBonusTickets} Bonus Ticket{totalBonusTickets > 1 ? 's' : ''} Earned!
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

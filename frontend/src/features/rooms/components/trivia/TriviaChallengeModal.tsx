/**
 * @fileoverview Trivia challenge modal - Gate before purchase
 * Users must answer a question correctly to unlock the purchase modal
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Sparkles, Check, XCircle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductQuestions } from '../../hooks/data/useProductQuestions';
import { useIsPurchaseUnlocked } from '../../hooks/data/useTriviaAttempts';
import { useAttemptTrivia } from '../../hooks/mutations/useAttemptTrivia';

interface TriviaChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomId: string;
  productClassId: string;
}

type AnswerState = 'pending' | 'correct' | 'incorrect';

export function TriviaChallengeModal({
  isOpen,
  onClose,
  onSuccess,
  roomId,
  productClassId,
}: TriviaChallengeModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('pending');
  const [correctOption, setCorrectOption] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { data: questions, isLoading: questionsLoading } = useProductQuestions(productClassId);
  const { isUnlocked, attemptsRemaining, cooldownEndsAt, isLoading: attemptsLoading } = useIsPurchaseUnlocked(roomId);
  const { mutate: attemptTrivia, isPending } = useAttemptTrivia();

  // Shuffle questions for variety
  const shuffledQuestions = useMemo(() => {
    if (!questions) return [];
    return [...questions].sort(() => Math.random() - 0.5);
  }, [questions]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const isOnCooldown = cooldownEndsAt && new Date() < cooldownEndsAt;

  // Auto-proceed if already unlocked
  useEffect(() => {
    if (isOpen && isUnlocked && !attemptsLoading) {
      onSuccess();
    }
  }, [isOpen, isUnlocked, attemptsLoading, onSuccess]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedOption(null);
      setAnswerState('pending');
      setCorrectOption(null);
      setCurrentQuestionIndex(0);
    }
  }, [isOpen]);

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQuestion || isPending) return;

    attemptTrivia(
      {
        roomId,
        questionId: currentQuestion.id,
        selectedOption,
      },
      {
        onSuccess: (result) => {
          setCorrectOption(result.correct_option || null);
          
          if (result.is_correct || result.can_purchase) {
            setAnswerState('correct');
            // Delay to show the correct answer animation
            setTimeout(() => {
              onSuccess();
            }, 1500);
          } else {
            setAnswerState('incorrect');
          }
        },
      }
    );
  };

  const handleTryAgain = () => {
    setSelectedOption(null);
    setAnswerState('pending');
    setCorrectOption(null);
    // Move to next question
    setCurrentQuestionIndex((prev) => (prev + 1) % shuffledQuestions.length);
  };

  const options = currentQuestion
    ? [
        { key: 'A', text: currentQuestion.option_a },
        { key: 'B', text: currentQuestion.option_b },
        { key: 'C', text: currentQuestion.option_c },
        { key: 'D', text: currentQuestion.option_d },
      ]
    : [];

  // Render cooldown state
  if (isOnCooldown && isOpen) {
    const timeLeft = Math.max(0, Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 1000 / 60));
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-zinc-950 rounded-2xl border-4 border-white shadow-sticker overflow-hidden p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>

            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-warning" />
            </div>
            
            <h2 className="font-display text-xl text-foreground mb-2">TAKE A BREAK</h2>
            <p className="text-muted-foreground text-sm mb-4">
              You've used all your attempts. Come back in {timeLeft} minute{timeLeft !== 1 ? 's' : ''} to try again!
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-zinc-950 rounded-2xl border-4 border-white shadow-sticker overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 border-b border-border/30">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/30 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg text-foreground">ANSWER TO ENTER</h2>
                  <p className="text-sm text-muted-foreground">Prove you know this product!</p>
                </div>
              </div>

              {/* Attempts indicator */}
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-muted-foreground">Attempts:</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-3 h-3 rounded-full transition-colors',
                        i < attemptsRemaining ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-1">{attemptsRemaining} left</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {questionsLoading || attemptsLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading question...</div>
                </div>
              ) : !currentQuestion ? (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <Sparkles className="w-10 h-10 text-primary mb-3" />
                  <p className="text-foreground font-medium">No trivia questions available</p>
                  <p className="text-sm text-muted-foreground mt-1">You can proceed to purchase!</p>
                  <button
                    onClick={onSuccess}
                    className="mt-4 px-6 py-3 rounded-xl gradient-hype text-white font-display border-2 border-white shadow-sticker"
                  >
                    CONTINUE
                  </button>
                </div>
              ) : (
                <>
                  {/* Question */}
                  <div className="mb-5">
                    <p className="text-foreground text-lg font-medium leading-snug">
                      {currentQuestion.question_text}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {options.map((option, idx) => {
                      const isSelected = selectedOption === option.key;
                      const isCorrect = answerState !== 'pending' && correctOption === option.key;
                      const isWrong = answerState === 'incorrect' && isSelected && !isCorrect;
                      const tiltClass = idx % 2 === 0 ? '-rotate-1' : 'rotate-1';

                      return (
                        <motion.button
                          key={option.key}
                          onClick={() => answerState === 'pending' && setSelectedOption(option.key)}
                          disabled={answerState !== 'pending' || isPending}
                          className={cn(
                            'relative p-4 rounded-xl border-2 transition-all text-left transform',
                            tiltClass,
                            answerState === 'pending' && isSelected && 'border-primary bg-primary/10',
                            answerState === 'pending' && !isSelected && 'border-white/20 bg-zinc-900 hover:border-white/40',
                            isCorrect && 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
                            isWrong && 'border-red-500 bg-red-500/20',
                            answerState !== 'pending' && !isCorrect && !isWrong && 'opacity-50'
                          )}
                          whileHover={answerState === 'pending' ? { scale: 1.02 } : {}}
                          whileTap={answerState === 'pending' ? { scale: 0.98 } : {}}
                        >
                          <div className="flex items-start gap-2">
                            <span className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                              isCorrect && 'bg-emerald-500 text-white',
                              isWrong && 'bg-red-500 text-white',
                              !isCorrect && !isWrong && 'bg-white/10 text-white/70'
                            )}>
                              {isCorrect ? <Check className="w-3.5 h-3.5" /> : 
                               isWrong ? <X className="w-3.5 h-3.5" /> : option.key}
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              isCorrect && 'text-emerald-400',
                              isWrong && 'text-red-400',
                              !isCorrect && !isWrong && 'text-foreground'
                            )}>
                              {option.text}
                            </span>
                          </div>

                          {/* Correct answer glow effect */}
                          {isCorrect && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute -top-2 -right-2 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full border-2 border-white shadow-sticker"
                            >
                              ✓
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  {answerState === 'pending' && (
                    <motion.button
                      onClick={handleSubmitAnswer}
                      disabled={!selectedOption || isPending}
                      className={cn(
                        'w-full py-4 rounded-xl font-display text-lg transition-all border-4 border-white shadow-sticker',
                        selectedOption
                          ? 'gradient-hype text-white hover:shadow-lg'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      )}
                      whileHover={selectedOption ? { scale: 1.02 } : {}}
                      whileTap={selectedOption ? { scale: 0.98 } : {}}
                    >
                      {isPending ? 'CHECKING...' : 'SUBMIT ANSWER'}
                    </motion.button>
                  )}

                  {answerState === 'correct' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-xl">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        <span className="font-display text-emerald-400">CORRECT! UNLOCKING...</span>
                      </div>
                    </motion.div>
                  )}

                  {answerState === 'incorrect' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-center gap-2 text-red-400">
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">Wrong answer!</span>
                      </div>

                      {attemptsRemaining > 0 ? (
                        <button
                          onClick={handleTryAgain}
                          className="w-full py-4 rounded-xl gradient-hype text-white font-display border-4 border-white shadow-sticker flex items-center justify-center gap-2"
                        >
                          TRY ANOTHER QUESTION
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      ) : (
                        <div className="text-center text-muted-foreground text-sm">
                          No attempts remaining. Try again in 1 hour.
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * @fileoverview Animated countdown timer for room deadlines
 */

import { memo, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  deadline: string;
  onExpire?: () => void;
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const CountdownTimer = memo(function CountdownTimer({
  deadline,
  onExpire,
  label = 'Time Remaining',
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(deadline);
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.total <= 0 && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  const isUrgent = timeLeft.total <= 3600000; // Less than 1 hour
  const isCritical = timeLeft.total <= 600000; // Less than 10 minutes
  const isExpired = timeLeft.total <= 0;

  return (
    <div className={`rounded-2xl border-4 shadow-sticker mb-4 transform rotate-[0.5deg] overflow-hidden ${
      isCritical 
        ? 'border-red-500' 
        : isUrgent 
        ? 'border-amber-400'
        : 'border-white'
    }`}>
      <div className="p-4 bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isCritical ? (
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            ) : (
              <Clock className={`w-5 h-5 ${isUrgent ? 'text-amber-400' : 'text-hype-pink'}`} />
            )}
            <span className={`font-display text-sm ${isCritical ? 'text-red-400' : 'text-white'}`}>
              {label.toUpperCase()}
            </span>
          </div>
          {isUrgent && !isExpired && (
            <span className="px-3 py-1 rounded-full bg-amber-500/30 text-amber-400 text-xs font-display border border-amber-400/50">
              ENDING SOON!
            </span>
          )}
        </div>

        {isExpired ? (
          <div className="text-center py-2">
            <span className="text-2xl font-display text-red-400">TIME'S UP!</span>
          </div>
        ) : (
          /* Time boxes */
          <div className="grid grid-cols-4 gap-2">
            <TimeBox value={timeLeft.days} label="Days" isUrgent={isUrgent} isCritical={isCritical} />
            <TimeBox value={timeLeft.hours} label="Hours" isUrgent={isUrgent} isCritical={isCritical} />
            <TimeBox value={timeLeft.minutes} label="Mins" isUrgent={isUrgent} isCritical={isCritical} />
            <TimeBox value={timeLeft.seconds} label="Secs" isUrgent={isUrgent} isCritical={isCritical} animate />
          </div>
        )}

        {/* Urgency message */}
        {isCritical && !isExpired && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-center text-sm text-red-400"
          >
            Last chance to enter before the draw!
          </motion.p>
        )}
      </div>
    </div>
  );
});

interface TimeBoxProps {
  value: number;
  label: string;
  isUrgent?: boolean;
  isCritical?: boolean;
  animate?: boolean;
}

const TimeBox = memo(function TimeBox({ value, label, isUrgent, isCritical, animate }: TimeBoxProps) {
  return (
    <div className={`p-2 rounded-xl text-center border-2 ${
      isCritical 
        ? 'bg-red-500/20 border-red-500/50' 
        : isUrgent 
        ? 'bg-amber-500/20 border-amber-500/50'
        : 'bg-zinc-800 border-white/30'
    }`}>
      <motion.span
        key={value}
        initial={animate ? { scale: 1.2 } : {}}
        animate={{ scale: 1 }}
        className={`block text-3xl font-display ${
          isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-white'
        }`}
      >
        {value.toString().padStart(2, '0')}
      </motion.span>
      <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
});

function calculateTimeLeft(deadline: string): TimeLeft {
  const difference = new Date(deadline).getTime() - Date.now();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}

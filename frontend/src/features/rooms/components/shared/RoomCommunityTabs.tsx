/**
 * @fileoverview Rules and Community Chat tabs for lot detail
 * User-facing terms: Entries, Odds, Stash Credits
 */

import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, MessageCircle, Send, Lightbulb, Layers, Gift, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { ECONOMY_MESSAGING, VC_TO_ENTRY_RATE } from '../../constants';
import type { RoomTier } from '../../types';

interface RoomCommunityTabsProps {
  roomId: string;
  tier: RoomTier;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

export const RoomCommunityTabs = memo(function RoomCommunityTabs({ 
  roomId, 
  tier 
}: RoomCommunityTabsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rules' | 'chat'>('rules');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: 'system',
      username: 'System',
      message: 'Welcome to the lot chat! Be respectful and have fun.',
      timestamp: new Date(),
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.email?.split('@')[0] || 'Anonymous',
      message: newMessage.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900 border-4 border-white shadow-sticker transform rotate-[0.3deg] mb-4 overflow-hidden">
      {/* Tabs - sticker style */}
      <div className="flex border-b-2 border-white/20 bg-zinc-800">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors ${
            activeTab === 'rules' 
              ? 'gradient-hype text-white border-b-4 border-white' 
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4" strokeWidth={2.5} />
          HOW IT WORKS
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors ${
            activeTab === 'chat' 
              ? 'gradient-hype text-white border-b-4 border-white' 
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
          CHAT
          {messages.length > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-display">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'rules' ? (
          <motion.div
            key="rules"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-display text-sm text-white mb-3 flex items-center gap-2">
                  <div className="p-1 rounded-full bg-amber-500/20 border-2 border-amber-400">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.5} />
                  </div>
                  HOW LOTS WORK
                </h4>
                
                {/* Step 1 */}
                <div className="flex gap-3 mb-3 p-2 rounded-xl bg-white/5 border border-white/10 transform -rotate-[0.3deg]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-cyan-400" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs text-white font-bold">Buy Entries</p>
                    <p className="text-[10px] text-white/50">
                      {ECONOMY_MESSAGING.ENTRIES.perDollar} • Or use {VC_TO_ENTRY_RATE} Credits per entry
                    </p>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="flex gap-3 mb-3 p-2 rounded-xl bg-white/5 border border-white/10 transform rotate-[0.3deg]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/20 border-2 border-violet-400 flex items-center justify-center">
                    <span className="text-lg">🎲</span>
                  </div>
                  <div>
                    <p className="text-xs text-white font-bold">Random Draw</p>
                    <p className="text-[10px] text-white/50">
                      When fully funded, a winner is randomly selected
                    </p>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="flex gap-3 p-2 rounded-xl bg-white/5 border border-white/10 transform -rotate-[0.2deg]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs text-white font-bold">Everyone Wins Something</p>
                    <p className="text-[10px] text-white/50">
                      {ECONOMY_MESSAGING.LOSER.message}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Odds formula - sticker style */}
              <div className="p-3 rounded-xl gradient-hype border-2 border-white shadow-sticker transform rotate-[0.5deg]">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-white" strokeWidth={2.5} />
                  <p className="text-xs text-white font-bold">
                    <span className="font-display">YOUR ODDS</span> = Your Entries ÷ Total Entries
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col h-[200px]"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.userId === user?.id ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 border-2 ${
                    msg.userId === 'system' 
                      ? 'bg-blue-500/20 border-blue-400/50 text-blue-300' 
                      : msg.userId === user?.id 
                        ? 'gradient-hype border-white text-white shadow-sticker transform rotate-[0.3deg]' 
                        : 'bg-white/10 border-white/20 text-white/90'
                  }`}>
                    {msg.userId !== user?.id && msg.userId !== 'system' && (
                      <span className="text-[10px] text-white/50 block mb-0.5 font-bold">
                        {msg.username}
                      </span>
                    )}
                    <p className="text-xs font-semibold">{msg.message}</p>
                  </div>
                  <span className="text-[9px] text-white/30 mt-0.5 px-1 font-semibold">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-2 border-t-2 border-white/20 bg-zinc-800">
              {user ? (
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 h-9 text-xs bg-white/5 border-2 border-white/20 rounded-xl font-semibold"
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 gradient-hype border-2 border-white shadow-sticker rounded-xl"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" strokeWidth={2.5} />
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-white/40 text-center py-1 font-semibold">
                  Sign in to join the chat
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

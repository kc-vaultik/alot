/**
 * @fileoverview Notification Center Component
 * @description Bell icon with dropdown notification panel with real-time updates
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Gift, ArrowLeftRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type Notification,
} from '../hooks/actions';
import { useAuth } from '@/contexts/AuthContext';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'gift_received':
    case 'gift_claimed':
      return <Gift className="w-4 h-4 text-pink-400" />;
    case 'swap_offer':
    case 'swap_completed':
      return <ArrowLeftRight className="w-4 h-4 text-blue-400" />;
    default:
      return <Sparkles className="w-4 h-4 text-violet-400" />;
  }
}

function formatTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Just now';
  }
}

export function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
    
    // Navigate to claim page for gift/swap notifications
    if (
      (notification.type === 'gift_received' || notification.type === 'swap_offer') &&
      notification.data?.claim_token
    ) {
      setOpen(false);
      navigate(`/collect-room/claim/${encodeURIComponent(String(notification.data.claim_token))}`);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllRead.mutate();
  };

  // Don't show notification center if not logged in
  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <Bell className="w-5 h-5 text-white/70" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-medium text-white bg-gradient-to-br from-violet-500 to-purple-600 rounded-full"
            >
              {unreadCount}
            </motion.span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-zinc-900/95 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          <AnimatePresence>
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="w-6 h-6 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-white/40 text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                    !notification.read ? 'bg-violet-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="pt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-white/30 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="pt-1.5">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}

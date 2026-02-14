'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotificationsStore, Notification, NotificationType } from '@/stores/notifications-store';
import { cn } from '@/lib/utils';
import { Bell, Check, Trash2, Zap, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import Link from 'next/link';

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  entrada: { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  alerta: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  sucesso: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20' },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function NotificationItem({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const { markAsRead, removeNotification } = useNotificationsStore();
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  const handleClick = () => {
    markAsRead(notification.id);
    if (notification.link) {
      onClose();
    }
  };

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        notification.read ? 'bg-zinc-800/30' : 'bg-zinc-800/70',
        'hover:bg-zinc-700/50'
      )}
      onClick={handleClick}
    >
      <div className={cn('p-2 rounded-lg', config.bg)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm font-medium', notification.read ? 'text-zinc-400' : 'text-white')}>
            {notification.title}
          </p>
          <span className="text-xs text-zinc-500 whitespace-nowrap">
            {formatTimeAgo(new Date(notification.timestamp))}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{notification.message}</p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeNotification(notification.id);
        }}
        className="p-1 rounded hover:bg-zinc-600 text-zinc-500 hover:text-zinc-300 flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }

  return content;
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotificationsStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-zinc-800 transition-colors"
      >
        <Bell className="h-5 w-5 text-zinc-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-purple-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h3 className="font-semibold text-white">Notificações</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Marcar lidas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-zinc-500 hover:text-zinc-400 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

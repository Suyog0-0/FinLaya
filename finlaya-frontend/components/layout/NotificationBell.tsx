'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, CreditCard, CheckCheck, AlertCircle } from 'lucide-react';
import { useNotifications, AppNotification, NotificationSeverity } from '@/lib/contexts/NotificationContext';

// ── Severity colors for the dropdown rows ─────────────────────────────────────
const severityIcon: Record<NotificationSeverity, { iconBg: string; iconColor: string }> = {
  warning:  { iconBg: 'bg-yellow-100', iconColor: 'text-yellow-500' },
  critical: { iconBg: 'bg-red-100',    iconColor: 'text-red-500'    },
  info:     { iconBg: 'bg-blue-100',   iconColor: 'text-blue-500'   },
};

// ── Single notification row ────────────────────────────────────────────────────
function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const isBudget = notification.type === 'budget_alert';
  const severity = notification.severity ?? 'info';
  const styles   = severityIcon[severity];

  const Icon = isBudget
    ? (severity === 'critical' ? AlertTriangle : AlertCircle)
    : CreditCard;

  const timeAgo = (() => {
    const diff  = Date.now() - new Date(notification.created_at).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (days > 0)  return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0)  return `${mins}m ago`;
    return 'Just now';
  })();

  // Unread row background tinted by severity
  const unreadBg =
    severity === 'critical' ? 'bg-red-50/40 hover:bg-red-50/70' :
    severity === 'warning'  ? 'bg-yellow-50/40 hover:bg-yellow-50/70' :
    'bg-orange-50/40 hover:bg-orange-50/70';

  return (
    <div
      onClick={() => !notification.is_read && onRead(notification.id)}
      className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer border-b border-gray-50 last:border-0 ${
        notification.is_read ? 'hover:bg-gray-50' : unreadBg
      }`}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${styles.iconBg}`}>
        <Icon size={14} className={styles.iconColor} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold leading-snug ${
            notification.is_read ? 'text-gray-600' : 'text-gray-900'
          }`}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${
              severity === 'critical' ? 'bg-red-500' :
              severity === 'warning'  ? 'bg-yellow-400' :
              'bg-blue-500'
            }`} />
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[10px] text-gray-300 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

// ── Bell with dropdown ─────────────────────────────────────────────────────────
export default function NotificationBell() {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Bell badge color — red if any critical unread, yellow if warning, else orange
  const hasCriticalUnread = notifications.some((n) => !n.is_read && n.severity === 'critical');
  const hasWarningUnread  = notifications.some((n) => !n.is_read && n.severity === 'warning');
  const badgeBg =
    hasCriticalUnread ? 'bg-red-500' :
    hasWarningUnread  ? 'bg-yellow-400' :
    'bg-orange-500';

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={`absolute top-1 right-1 w-4 h-4 ${badgeBg} text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-orange-500 transition-colors font-medium"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">All caught up!</p>
                <p className="text-xs text-gray-300 mt-0.5">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markRead} />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <p className="text-[11px] text-gray-400 text-center">
                Showing last 30 notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
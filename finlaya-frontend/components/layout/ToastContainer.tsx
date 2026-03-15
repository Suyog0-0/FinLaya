'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard, X, AlertCircle } from 'lucide-react';
import { useNotifications, AppNotification, NotificationSeverity } from '@/lib/contexts/NotificationContext';

// ── Severity styling map ───────────────────────────────────────────────────────
const severityStyles: Record<NotificationSeverity, {
  bar:     string;
  icon:    string;
  iconBg:  string;
  title:   string;
  message: string;
  bg:      string;
  border:  string;
  progress: string;
}> = {
  warning: {
    bar:      'bg-yellow-400',
    icon:     'text-yellow-600',
    iconBg:   'bg-yellow-100',
    title:    'text-yellow-900',
    message:  'text-yellow-700',
    bg:       'bg-yellow-50',
    border:   'border-yellow-200',
    progress: 'bg-yellow-400',
  },
  critical: {
    bar:      'bg-red-500',
    icon:     'text-red-600',
    iconBg:   'bg-red-100',
    title:    'text-red-900',
    message:  'text-red-700',
    bg:       'bg-red-50',
    border:   'border-red-200',
    progress: 'bg-red-500',
  },
  info: {
    bar:      'bg-blue-400',
    icon:     'text-blue-600',
    iconBg:   'bg-blue-100',
    title:    'text-gray-900',
    message:  'text-gray-500',
    bg:       'bg-white',
    border:   'border-gray-200',
    progress: 'bg-blue-400',
  },
};

// ── Single toast card ──────────────────────────────────────────────────────────
function Toast({
  notification,
  onDismiss,
}: {
  notification: AppNotification;
  onDismiss:    () => void;
}) {
  const [visible,  setVisible]  = useState(false);   // controls slide-in
  const [leaving,  setLeaving]  = useState(false);   // controls slide-out
  const [progress, setProgress] = useState(100);     // countdown bar

  const DURATION = 5000; // ms

  const styles = severityStyles[notification.severity ?? 'info'];
  const isBudget = notification.type === 'budget_alert';
  const Icon = isBudget
    ? (notification.severity === 'critical' ? AlertTriangle : AlertCircle)
    : CreditCard;

  // Slide in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Countdown progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p - (100 / (DURATION / 100));
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Auto-dismiss after DURATION
  useEffect(() => {
    const t = setTimeout(() => handleDismiss(), DURATION);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(onDismiss, 350); // wait for slide-out animation
  };

  return (
    <div
      style={{
        transform:  leaving  ? 'translateX(110%)' :
                    visible  ? 'translateX(0)'    : 'translateX(110%)',
        opacity:    leaving  ? 0 : visible ? 1 : 0,
        transition: 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease',
      }}
      className={`relative w-80 rounded-2xl shadow-lg border overflow-hidden ${styles.bg} ${styles.border}`}
    >
      {/* Coloured left bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.bar}`} />

      {/* Content */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-3 pl-5">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${styles.iconBg}`}>
          <Icon size={15} className={styles.icon} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold leading-snug ${styles.title}`}>
            {notification.title}
          </p>
          <p className={`text-[11px] mt-0.5 leading-relaxed ${styles.message}`}>
            {notification.message}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar — drains over 5s */}
      <div className="h-0.5 w-full bg-black/5">
        <div
          className={`h-full ${styles.progress} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ── Container — fixed top-right, stacks multiple toasts ───────────────────────
export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast notification={toast} onDismiss={() => dismissToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Reminder {
  id: string;
  orderId: string;
  orderNumber?: string;
  message: string;
  dueDate: any;
  status: 'active' | 'snoozed' | 'dismissed';
}

export default function ReminderBell() {
  const { currentUser } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const load = async () => {
      try {
        const { getRemindersByUser } = await import('@/firebase/reminderService');
        const data = await getRemindersByUser(currentUser.uid);
        setReminders(data.filter(r => r.status !== 'dismissed') as Reminder[]);
      } catch (e) { /* ignore */ }
    };
    load();
    // Refresh every 60 seconds
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [currentUser?.uid]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const now = new Date();
  const dueReminders = reminders.filter(r => {
    const due = r.dueDate?.toDate ? r.dueDate.toDate() : new Date(r.dueDate);
    return due <= now;
  });
  const upcomingReminders = reminders.filter(r => {
    const due = r.dueDate?.toDate ? r.dueDate.toDate() : new Date(r.dueDate);
    return due > now;
  });
  const badgeCount = dueReminders.length;

  if (reminders.length === 0) return null;

  return (
    <div ref={ref} className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        title={`${badgeCount} due reminder${badgeCount !== 1 ? 's' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Reminders</h3>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {dueReminders.length === 0 && upcomingReminders.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No reminders</div>
            )}
            {dueReminders.map(r => {
              const due = r.dueDate?.toDate ? r.dueDate.toDate() : new Date(r.dueDate);
              return (
                <Link key={r.id} href={`/admin/orders/${r.orderId}`} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-red-50 transition-colors">
                  <p className="text-sm font-medium text-red-800">{r.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.orderNumber || r.orderId.slice(0, 8)} · {due.toLocaleDateString('sv-SE')} {due.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                    <span className="text-red-600 font-medium ml-1">OVERDUE</span>
                  </p>
                </Link>
              );
            })}
            {upcomingReminders.map(r => {
              const due = r.dueDate?.toDate ? r.dueDate.toDate() : new Date(r.dueDate);
              return (
                <Link key={r.id} href={`/admin/orders/${r.orderId}`} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-amber-50 transition-colors">
                  <p className="text-sm font-medium text-gray-800">{r.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.orderNumber || r.orderId.slice(0, 8)} · {due.toLocaleDateString('sv-SE')} {due.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { Task } from '../types';

interface DashboardProps {
  tasks: Task[];
}

export function Dashboard({ tasks }: DashboardProps) {
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate tasks created today
  const createdTodayCount = tasks.filter((t) => {
    try {
      const cd = new Date(t.createdAt);
      const today = new Date();
      return (
        cd.getDate() === today.getDate() &&
        cd.getMonth() === today.getMonth() &&
        cd.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  }).length;

  // Calculate overdue count
  const overdueCount = tasks.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    try {
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d < today;
    } catch {
      return false;
    }
  }).length;

  // Format with leading zero
  const formatNum = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {/* Total Tasks Card */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-widest mb-1 font-mono">
          Total Tasks
        </p>
        <div className="flex items-end justify-between sm:justify-start gap-2">
          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 font-display">
            {formatNum(totalCount)}
          </span>
          <span className="text-xs text-green-600 dark:text-green-400 font-bold mb-1">
            +{createdTodayCount} today
          </span>
        </div>
      </div>

      {/* Pending Tasks Card */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-widest mb-1 font-mono">
          Pending
        </p>
        <div className="flex items-end justify-between sm:justify-start gap-2">
          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 font-display">
            {formatNum(pendingCount)}
          </span>
          {overdueCount > 0 ? (
            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1">
              {overdueCount} overdue
            </span>
          ) : (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-1">
              In progress
            </span>
          )}
        </div>
      </div>

      {/* Completed Tasks Card */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-widest mb-1 font-mono">
          Completed
        </p>
        <div className="flex items-end justify-between sm:justify-start gap-2">
          <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 font-display">
            {formatNum(completedCount)}
          </span>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1">
            {completionPercentage}% rate
          </span>
        </div>
      </div>
    </div>
  );
}

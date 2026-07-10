import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Edit2, Trash2, CheckCircle2, Circle, AlertCircle, Bookmark } from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
  key?: string;
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDeleteRequest: (task: Task) => void;
}

export function TaskCard({ task, onToggleComplete, onEdit, onDeleteRequest }: TaskCardProps) {
  // Check if due date is overdue (only if not completed)
  const isOverdue = (() => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  })();

  // Format creation and due dates
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Badges color schemes
  const priorityColors = {
    High: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    Medium: 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400',
    Low: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  };

  const categoryColors = {
    Work: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300',
    Personal: 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300',
    Study: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    Other: 'bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm flex items-center gap-4 transition-all duration-150 ${
        task.completed
          ? 'border-gray-100 dark:border-zinc-800/80 border-l-4 border-l-indigo-500 dark:border-l-indigo-600 bg-zinc-50/50 dark:bg-zinc-900/40 opacity-80'
          : isOverdue
          ? 'border-rose-300 dark:border-rose-900 bg-rose-50/10 dark:bg-rose-950/5 hover:border-rose-400'
          : 'border-gray-100 dark:border-zinc-800/80 hover:border-indigo-200 dark:hover:border-indigo-800'
      }`}
    >
      {/* Left: Completion Toggle Checkbox */}
      <button
        onClick={() => onToggleComplete(task.id)}
        className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center cursor-pointer focus:outline-none transition-colors"
        title={task.completed ? 'Mark as Pending' : 'Mark as Completed'}
      >
        {task.completed ? (
          <div className="w-6 h-6 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-6 h-6 rounded border-2 border-zinc-300 dark:border-zinc-600 hover:border-indigo-500 dark:hover:border-indigo-400" />
        )}
      </button>

      {/* Center: Title & Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className={`font-bold text-gray-800 dark:text-zinc-100 truncate ${
              task.completed ? 'line-through text-gray-400 dark:text-zinc-500 font-normal' : ''
            }`}
          >
            {task.title}
          </h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              priorityColors[task.priority]
            }`}
          >
            {task.priority === 'Medium' ? 'Med' : task.priority}
          </span>
        </div>
        {task.description && (
          <p
            className={`text-sm mt-0.5 truncate ${
              task.completed ? 'text-gray-400 dark:text-zinc-600 line-through' : 'text-gray-500 dark:text-zinc-400'
            }`}
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Right: Category & Due Date / Actions */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <span
            className={`text-xs px-2.5 py-1 rounded-md font-medium inline-block ${
              categoryColors[task.category]
            }`}
          >
            {task.category}
          </span>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
            {task.completed ? (
              <span>Done</span>
            ) : task.dueDate ? (
              <span>Due {formatDate(task.dueDate)}</span>
            ) : (
              <span>No due date</span>
            )}
          </p>
        </div>

        {/* Hover/Always visible Actions (Edit & Delete) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Edit Task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteRequest(task)}
            className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}


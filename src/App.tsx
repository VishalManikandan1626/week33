import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Moon,
  Sun,
  Trash2,
  CheckSquare,
  Sparkles,
  Calendar,
  XCircle,
  FolderMinus,
  RefreshCw,
  FolderOpen,
  Menu,
  X
} from 'lucide-react';

import { Task, Priority, Category, ToastMessage } from './types';
import { Dashboard } from './components/Dashboard';
import { TaskCard } from './components/TaskCard';
import { TaskForm } from './components/TaskForm';
import { DeleteModal } from './components/DeleteModal';
import { ToastContainer } from './components/Toast';

// Mock Initial Data for Internship Appeal
const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Complete Internship Documentation',
    description: 'Structure HTML, CSS and JavaScript logic overviews inside the submission folder.',
    priority: 'High',
    category: 'Work',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
    createdAt: new Date().toISOString(),
    completed: false,
  },
  {
    id: 'task-2',
    title: 'Review Responsive Layout Guidelines',
    description: 'Verify touch target spacing and screen scaling inside developer options on mobile viewports.',
    priority: 'Medium',
    category: 'Study',
    dueDate: new Date().toISOString().split('T')[0], // Today
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    completed: true,
  },
  {
    id: 'task-3',
    title: 'Organize Study Materials',
    description: 'Categorize books, notes, and bookmark relevant online documentation for the upcoming finals.',
    priority: 'Low',
    category: 'Personal',
    dueDate: '',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    completed: false,
  },
];

export default function App() {
  // --- States ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Completed' | 'Pending'>('All');
  const [filterCategory, setFilterCategory] = useState<'All' | Category>('All');
  const [filterPriority, setFilterPriority] = useState<'All' | Priority>('All');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'dueDate' | 'priority'>('newest');

  // Modal Control States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Deletion Dialog States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'all' | 'completed'>('single');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Mobile Sidebar State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Notification Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Current Date Helper
  const formattedToday = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // --- Initialize & Sync ---
  useEffect(() => {
    // Sync Theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Sync Tasks
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch {
        setTasks(INITIAL_TASKS);
      }
    } else {
      setTasks(INITIAL_TASKS);
      localStorage.setItem('tasks', JSON.stringify(INITIAL_TASKS));
    }
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('tasks', JSON.stringify(newTasks));
  };

  // --- Actions ---

  // Toast Trigger Helper
  const addToast = (text: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Theme Toggle
  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      addToast('Dark mode enabled', 'info');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      addToast('Light mode enabled', 'info');
    }
  };

  // Toggle Single Task Complete
  const handleToggleComplete = (id: string) => {
    const nextTasks = tasks.map((task) => {
      if (task.id === id) {
        const nextState = !task.completed;
        addToast(
          nextState ? `"${task.title}" completed!` : `"${task.title}" marked pending.`,
          nextState ? 'success' : 'info'
        );
        return { ...task, completed: nextState };
      }
      return task;
    });
    saveTasks(nextTasks);
  };

  // Form Submit Handler (Add / Edit)
  const handleFormSubmit = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    if (editingTask) {
      // Edit Mode
      const updatedTasks = tasks.map((t) =>
        t.id === editingTask.id ? { ...t, ...taskData } : t
      );
      saveTasks(updatedTasks);
      addToast(`"${taskData.title}" updated successfully`, 'success');
      setEditingTask(null);
    } else {
      // Add Mode
      // Check for exact duplicate title in incomplete tasks to prevent spamming
      const isDuplicate = tasks.some(
        (t) => t.title.toLowerCase().trim() === taskData.title.toLowerCase().trim() && !t.completed
      );

      if (isDuplicate) {
        addToast('An incomplete task with this title already exists!', 'warning');
        return;
      }

      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskData,
        createdAt: new Date().toISOString(),
        completed: false,
      };
      saveTasks([newTask, ...tasks]);
      addToast(`Added "${taskData.title}"`, 'success');
    }
  };

  // Edit Button Action
  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // Delete Request Action Triggers
  const handleDeleteRequest = (task: Task) => {
    setTaskToDelete(task);
    setDeleteType('single');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteAllRequest = () => {
    if (tasks.length === 0) {
      addToast('No tasks to delete!', 'warning');
      return;
    }
    setDeleteType('all');
    setIsDeleteModalOpen(true);
  };

  const handleClearCompletedRequest = () => {
    const hasCompleted = tasks.some((t) => t.completed);
    if (!hasCompleted) {
      addToast('No completed tasks to clear!', 'warning');
      return;
    }
    setDeleteType('completed');
    setIsDeleteModalOpen(true);
  };

  // Final Confirmed Deletions
  const handleConfirmDelete = () => {
    if (deleteType === 'single' && taskToDelete) {
      const nextTasks = tasks.filter((t) => t.id !== taskToDelete.id);
      saveTasks(nextTasks);
      addToast(`Deleted "${taskToDelete.title}"`, 'error');
      setTaskToDelete(null);
    } else if (deleteType === 'all') {
      saveTasks([]);
      addToast('All tasks cleared successfully', 'error');
    } else if (deleteType === 'completed') {
      const nextTasks = tasks.filter((t) => !t.completed);
      saveTasks(nextTasks);
      addToast('Cleared completed tasks', 'success');
    }
  };

  // Filter & Search computation
  const filteredTasks = tasks
    .filter((task) => {
      // Search Title or Description
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Status
      const matchesStatus =
        filterStatus === 'All'
          ? true
          : filterStatus === 'Completed'
          ? task.completed
          : !task.completed;

      // Category
      const matchesCategory = filterCategory === 'All' ? true : task.category === filterCategory;

      // Priority
      const matchesPriority = filterPriority === 'All' ? true : task.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    })
    .sort((a, b) => {
      // Sorting Logic
      if (sortOption === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortOption === 'priority') {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return 0;
    });

  // Reset Filters Helper
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('All');
    setFilterCategory('All');
    setFilterPriority('All');
    setSortOption('newest');
    addToast('Filters reset', 'info');
  };

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const weeklyGoalPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate tasks due today
  const tasksDueToday = tasks.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      return t.dueDate === todayStr;
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F9FAFB] dark:bg-zinc-950 font-sans text-zinc-800 dark:text-zinc-100 select-none">
      
      {/* 1. Left Sidebar: Persistent on Desktop (lg:flex), slide-out on Mobile */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col p-6 h-full flex-shrink-0 hidden lg:flex">
        {/* Branding */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">TaskFlow</span>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-1">
          <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-3 font-mono">
            Main Menu
          </div>
          <button
            onClick={() => {
              setFilterStatus('All');
              setFilterCategory('All');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
              filterStatus === 'All' && filterCategory === 'All'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'All' && filterCategory === 'All' ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-transparent'}`} />
            All Tasks
          </button>
          <button
            onClick={() => {
              setFilterStatus('Pending');
              setFilterCategory('All');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
              filterStatus === 'Pending' && filterCategory === 'All'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'Pending' && filterCategory === 'All' ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-transparent'}`} />
            Pending
          </button>
          <button
            onClick={() => {
              setFilterStatus('Completed');
              setFilterCategory('All');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
              filterStatus === 'Completed' && filterCategory === 'All'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'Completed' && filterCategory === 'All' ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-transparent'}`} />
            Completed
          </button>

          <div className="mt-8 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-3 font-mono">
            Categories
          </div>
          {(['Work', 'Study', 'Personal', 'Other'] as const).map((cat) => {
            const count = tasks.filter((t) => t.category === cat).length;
            const isActive = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setFilterCategory(cat);
                  setFilterStatus('All'); // Show all tasks for category by default
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span>{cat}</span>
                <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500 dark:text-zinc-400 font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Progress indicator card at bottom */}
        <div className="mt-auto p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 font-mono">Weekly Goal</span>
            <span className="text-sm text-indigo-600 dark:text-indigo-400 font-black">{weeklyGoalPercentage}%</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${weeklyGoalPercentage}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
            {completedCount}/{totalCount} tasks completed.
          </p>
        </div>
      </aside>

      {/* 2. Slide-out Mobile Sidebar overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black z-45 lg:hidden"
            />
            {/* Sidebar drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col p-6 z-50 lg:hidden h-full"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">TaskFlow</span>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-650 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Section */}
              <nav className="flex-1 space-y-1">
                <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-3 font-mono">
                  Main Menu
                </div>
                <button
                  onClick={() => {
                    setFilterStatus('All');
                    setFilterCategory('All');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                    filterStatus === 'All' && filterCategory === 'All'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'All' && filterCategory === 'All' ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-transparent'}`} />
                  All Tasks
                </button>
                <button
                  onClick={() => {
                    setFilterStatus('Pending');
                    setFilterCategory('All');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                    filterStatus === 'Pending' && filterCategory === 'All'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'Pending' && filterCategory === 'All' ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-transparent'}`} />
                  Pending
                </button>
                <button
                  onClick={() => {
                    setFilterStatus('Completed');
                    setFilterCategory('All');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                    filterStatus === 'Completed' && filterCategory === 'All'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${filterStatus === 'Completed' && filterCategory === 'All' ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-transparent'}`} />
                  Completed
                </button>

                <div className="mt-8 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-3 font-mono">
                  Categories
                </div>
                {(['Work', 'Study', 'Personal', 'Other'] as const).map((cat) => {
                  const count = tasks.filter((t) => t.category === cat).length;
                  const isActive = filterCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setFilterCategory(cat);
                        setFilterStatus('All');
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-250 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500 dark:text-zinc-400 font-bold">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Progress indicator card at bottom */}
              <div className="mt-auto p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 font-mono">Weekly Goal</span>
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 font-black">{weeklyGoalPercentage}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${weeklyGoalPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
                  {completedCount}/{totalCount} tasks completed.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main content area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F9FAFB] dark:bg-zinc-950">
        
        {/* Header bar */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 md:px-8 flex-shrink-0">
          <div className="flex items-center flex-1">
            {/* Hamburger trigger for mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 rounded-lg mr-2 cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="relative w-48 sm:w-96">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search tasks, descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm bg-zinc-50/50 dark:bg-zinc-800/40 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 font-sans"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Right Date and Tasks due */}
            <div className="text-right mr-1 hidden md:block">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans">{formattedToday}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-450">
                {tasksDueToday} {tasksDueToday === 1 ? 'task' : 'tasks'} due today
              </p>
            </div>

            {/* Dark/Light mode button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Profile avatar initials */}
            <div
              className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs font-mono"
              title="Logged in as vishalmanikandanpvmkrct@gmail.com"
            >
              VM
            </div>
          </div>
        </header>

        {/* Dynamic content canvas */}
        <div className="p-6 md:p-8 flex-1 flex flex-col gap-6 overflow-y-auto">
          {/* Stats widgets */}
          <Dashboard tasks={tasks} />

          {/* Heading with sorts and action button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <h2 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100">
              Active Tasks {filterCategory !== 'All' ? `(${filterCategory})` : filterStatus !== 'All' ? `(${filterStatus})` : ''}
            </h2>
            <div className="flex items-center gap-3">
              {/* Sort selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono font-bold uppercase">Sort:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">High Priority</option>
                </select>
              </div>

              {/* Add task button */}
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsFormOpen(true);
                }}
                className="text-xs bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-650 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            </div>
          </div>

          {/* Simplified Quick Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-xl shadow-xs">
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-400 dark:text-zinc-500 uppercase text-[10px]">Status:</span>
                <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5">
                  {(['All', 'Completed', 'Pending'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                        filterStatus === status
                          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-250'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-400 dark:text-zinc-500 uppercase text-[10px]">Category:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                  className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-[11px]"
                >
                  <option value="All">All Categories</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Study">Study</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-400 dark:text-zinc-500 uppercase text-[10px]">Priority:</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-[11px]"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Clear filters or resetting */}
            {(searchQuery || filterStatus !== 'All' || filterCategory !== 'All' || filterPriority !== 'All') ? (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-sans"
              >
                Reset Filters
              </button>
            ) : (
              <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400">
                <button
                  onClick={handleClearCompletedRequest}
                  className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Clear Completed
                </button>
                <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
                <button
                  onClick={handleDeleteAllRequest}
                  className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* List Section */}
          <div className="flex-1 space-y-3.5 pb-8">
            <AnimatePresence mode="pop-layout">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEditClick}
                    onDeleteRequest={handleDeleteRequest}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl text-center"
                >
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl text-zinc-400 dark:text-zinc-600 mb-4">
                    {tasks.length === 0 ? (
                      <FolderOpen className="w-12 h-12" />
                    ) : (
                      <FolderMinus className="w-12 h-12" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-250 font-display">
                    {tasks.length === 0 ? 'No tasks created yet' : 'No matching tasks found'}
                  </h3>
                  <p className="text-sm text-zinc-450 dark:text-zinc-400 max-w-sm mt-1 leading-relaxed">
                    {tasks.length === 0
                      ? 'Add a task above using the "Add Task" button to start organizing your schedule.'
                      : 'Try broadening your search keyword or resetting category/priority filters to view hidden items.'}
                  </p>
                  {tasks.length > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="mt-5 flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reset Active Filters
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* --- Overlay Dialogs & Modals --- */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        editingTask={editingTask}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={
          deleteType === 'single'
            ? 'Delete Task'
            : deleteType === 'completed'
            ? 'Clear Completed Tasks'
            : 'Delete All Tasks'
        }
        message={
          deleteType === 'single' && taskToDelete
            ? `Are you sure you want to permanently delete the task "${taskToDelete.title}"? This action cannot be undone.`
            : deleteType === 'completed'
            ? 'Are you sure you want to clear all completed tasks from local storage? This action is irreversible.'
            : 'Are you absolutely sure you want to delete ALL tasks (both completed and pending)? This will completely reset your dashboard database.'
        }
        confirmText={
          deleteType === 'single'
            ? 'Delete'
            : deleteType === 'completed'
            ? 'Clear Completed'
            : 'Delete All'
        }
        isDanger={true}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

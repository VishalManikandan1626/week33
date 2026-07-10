/**
 * =========================================
 * INTERNSHIP SUBMISSION: CORE JAVASCRIPT
 * Task Management Application
 * =========================================
 * 
 * Features Implemented:
 * - Local Storage Synchronization
 * - Stats Tracking & Progress Bar fill
 * - Comprehensive Search, Filters & Sorting
 * - Add, Edit, Complete, & Delete Operations
 * - Light/Dark Theme Persistence
 * - Animated Custom Toast Notifications
 * - Custom Modal Dialogs for Forms & Confirmation
 */

// --- Global Application State ---
let tasks = [];
let editingTaskId = null;
let taskToDeleteId = null;
let deleteActionType = 'single'; // 'single' | 'all' | 'completed'

// Default Seed Data (Loaded on first startup)
const DEFAULT_SEED_TASKS = [
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

// --- DOM Element Selectors ---
const currentYearElement = document.getElementById('current-date');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIconDark = document.getElementById('theme-icon-dark');
const themeIconLight = document.getElementById('theme-icon-light');

// Modal Elements
const formModal = document.getElementById('form-modal');
const formModalContent = document.getElementById('form-modal-content');
const openFormBtn = document.getElementById('open-form-btn');
const closeFormBtn = document.getElementById('close-form-btn');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const taskForm = document.getElementById('task-form');
const validationError = document.getElementById('validation-error');

// Inputs
const taskTitleInput = document.getElementById('task-title-input');
const taskDescInput = document.getElementById('task-desc-input');
const taskCategoryInput = document.getElementById('task-category-input');
const taskPriorityInput = document.getElementById('task-priority-input');
const taskDateInput = document.getElementById('task-date-input');
const editTaskIdField = document.getElementById('edit-task-id');
const submitBtnText = document.getElementById('submit-btn-text');
const submitIconAdd = document.getElementById('submit-icon-add');
const submitIconEdit = document.getElementById('submit-icon-edit');

// Dashboard Counters
const statTotal = document.getElementById('stat-total');
const statCompleted = document.getElementById('stat-completed');
const statPending = document.getElementById('stat-pending');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');

// Filters & Sort
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterStatusAll = document.getElementById('filter-status-all');
const filterStatusCompleted = document.getElementById('filter-status-completed');
const filterStatusPending = document.getElementById('filter-status-pending');
const filterCategory = document.getElementById('filter-category');
const filterPriority = document.getElementById('filter-priority');
const resetFiltersBtn = document.getElementById('reset-filters');

// Task Container & Counters
const tasksContainer = document.getElementById('tasks-container');
const taskCountLabel = document.getElementById('task-count');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const clearAllBtn = document.getElementById('clear-all-btn');

// Delete Modal
const deleteModal = document.getElementById('delete-modal');
const deleteModalContent = document.getElementById('delete-modal-content');
const deleteModalTitle = document.getElementById('delete-modal-title');
const deleteModalMessage = document.getElementById('delete-modal-message');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const closeDeleteModal = document.getElementById('close-delete-modal');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// Active filter states
let activeStatusFilter = 'All'; // 'All' | 'Completed' | 'Pending'

// --- Core Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initializeCurrentDate();
  loadThemePreference();
  loadTasks();
  setupEventListeners();
  updateStats();
  renderTasks();
});

// Set formatted current header date
function initializeCurrentDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  currentYearElement.textContent = new Date().toLocaleDateString(undefined, options);
}

// --- Theme Management ---
function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
  
  if (isDark) {
    document.documentElement.classList.add('dark');
    themeIconDark.classList.add('hidden');
    themeIconLight.classList.remove('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    themeIconDark.classList.remove('hidden');
    themeIconLight.classList.add('hidden');
  }
}

function toggleTheme() {
  const isCurrentlyDark = document.documentElement.classList.contains('dark');
  if (isCurrentlyDark) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    themeIconDark.classList.remove('hidden');
    themeIconLight.classList.add('hidden');
    createToast('Light mode enabled', 'info');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    themeIconDark.classList.add('hidden');
    themeIconLight.classList.remove('hidden');
    createToast('Dark mode enabled', 'info');
  }
}

// --- Local Storage Sync ---
function loadTasks() {
  const saved = localStorage.getItem('tasks');
  if (saved) {
    try {
      tasks = JSON.parse(saved);
    } catch {
      tasks = DEFAULT_SEED_TASKS;
    }
  } else {
    tasks = DEFAULT_SEED_TASKS;
    localStorage.setItem('tasks', JSON.stringify(DEFAULT_SEED_TASKS));
  }
}

function saveToLocalStorage() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  updateStats();
  renderTasks();
}

// --- Statistics Counter Engine ---
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  statTotal.textContent = total;
  statCompleted.textContent = completed;
  statPending.textContent = pending;
  
  progressText.textContent = `(${completed} of ${total} completed)`;
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

// --- Custom Toast Manager ---
function createToast(message, type = 'info') {
  const toastId = `toast-${Date.now()}`;
  
  const iconMap = {
    success: 'check-circle-2',
    error: 'alert-circle',
    warning: 'alert-triangle',
    info: 'info'
  };

  const borderColors = {
    success: 'border-emerald-500/20 dark:border-emerald-500/10 shadow-emerald-500/5',
    error: 'border-rose-500/20 dark:border-rose-500/10 shadow-rose-500/5',
    warning: 'border-amber-500/20 dark:border-amber-500/10 shadow-amber-500/5',
    info: 'border-blue-500/20 dark:border-blue-500/10 shadow-blue-500/5'
  };

  const svgColors = {
    success: 'text-emerald-500',
    error: 'text-rose-500',
    warning: 'text-amber-500',
    info: 'text-blue-500'
  };

  const toastHTML = `
    <div id="${toastId}" class="flex items-center gap-3 p-4 rounded-xl border shadow-lg bg-white dark:bg-zinc-900 ${borderColors[type]} max-w-sm pointer-events-auto animate-slide-in">
      <div class="flex-shrink-0 ${svgColors[type]}">
        <i data-lucide="${iconMap[type]}" class="w-5 h-5"></i>
      </div>
      <p class="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-grow pr-2">${message}</p>
      <button onclick="removeToast('${toastId}')" class="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>
  `;

  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  lucide.createIcons();

  // Self auto-dismiss timer
  setTimeout(() => {
    removeToast(toastId);
  }, 4000);
}

window.removeToast = function(id) {
  const element = document.getElementById(id);
  if (element) {
    element.classList.remove('animate-slide-in');
    element.classList.add('animate-fade-out');
    element.addEventListener('animationend', () => {
      element.remove();
    });
  }
};

// --- Dialog / Modals Controllers ---
function openFormModal(isEdit = false) {
  validationError.classList.add('hidden');
  
  if (isEdit) {
    document.getElementById('modal-title').textContent = 'Edit Task';
    submitBtnText.textContent = 'Save Changes';
    submitIconAdd.classList.add('hidden');
    submitIconEdit.classList.remove('hidden');
  } else {
    document.getElementById('modal-title').textContent = 'Create New Task';
    submitBtnText.textContent = 'Add Task';
    submitIconAdd.classList.remove('hidden');
    submitIconEdit.classList.add('hidden');
    taskForm.reset();
    editTaskIdField.value = '';
  }
  
  formModal.classList.remove('hidden');
  setTimeout(() => {
    formModalContent.classList.remove('scale-95', 'opacity-0');
    formModalContent.classList.add('scale-100', 'opacity-100');
    taskTitleInput.focus();
  }, 10);
}

function closeFormModal() {
  formModalContent.classList.remove('scale-100', 'opacity-100');
  formModalContent.classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    formModal.classList.add('hidden');
    editingTaskId = null;
  }, 200);
}

function openDeleteModal(type, taskId = null) {
  deleteActionType = type;
  taskToDeleteId = taskId;

  if (type === 'single') {
    const task = tasks.find(t => t.id === taskId);
    deleteModalTitle.textContent = 'Delete Task';
    deleteModalMessage.textContent = `Are you sure you want to permanently delete the task "${task ? task.title : 'this task'}"? This action cannot be undone.`;
  } else if (type === 'completed') {
    deleteModalTitle.textContent = 'Clear Completed Tasks';
    deleteModalMessage.textContent = 'Are you sure you want to clear all completed tasks from local storage? This action is irreversible.';
  } else {
    deleteModalTitle.textContent = 'Delete All Tasks';
    deleteModalMessage.textContent = 'Are you absolutely sure you want to delete ALL tasks (both completed and pending)? This will completely reset your dashboard database.';
  }

  deleteModal.classList.remove('hidden');
  setTimeout(() => {
    deleteModalContent.classList.remove('scale-95', 'opacity-0');
    deleteModalContent.classList.add('scale-100', 'opacity-100');
  }, 10);
}

function closeDeleteModalDialog() {
  deleteModalContent.classList.remove('scale-100', 'opacity-100');
  deleteModalContent.classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    deleteModal.classList.add('hidden');
    taskToDeleteId = null;
  }, 200);
}

// --- Task Filter Reset Indicator Checker ---
function checkActiveFilters() {
  const hasSearch = searchInput.value.trim() !== '';
  const hasCategory = filterCategory.value !== 'All';
  const hasPriority = filterPriority.value !== 'All';
  const hasStatus = activeStatusFilter !== 'All';

  if (hasSearch || hasCategory || hasPriority || hasStatus) {
    resetFiltersBtn.classList.remove('hidden');
  } else {
    resetFiltersBtn.classList.add('hidden');
  }
}

// --- Task List Rendering Engine ---
function renderTasks() {
  tasksContainer.innerHTML = '';
  
  const query = searchInput.value.toLowerCase().trim();
  const category = filterCategory.value;
  const priority = filterPriority.value;
  const sort = sortSelect.value;

  // 1. Apply Filtering Chain
  let processedTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query);
    
    const matchesStatus = 
      activeStatusFilter === 'All' ? true :
      activeStatusFilter === 'Completed' ? task.completed : !task.completed;

    const matchesCategory = category === 'All' ? true : task.category === category;
    const matchesPriority = priority === 'All' ? true : task.priority === priority;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  // 2. Apply Sorting logic
  processedTasks.sort((a, b) => {
    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sort === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sort === 'priority') {
      const weight = { High: 3, Medium: 2, Low: 1 };
      return weight[b.priority] - weight[a.priority];
    }
    return 0;
  });

  taskCountLabel.textContent = processedTasks.length;
  checkActiveFilters();

  // 3. Render Items or Empty State Illustration
  if (processedTasks.length === 0) {
    const isEmptyDatabase = tasks.length === 0;
    tasksContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl text-center">
        <div class="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl text-zinc-400 dark:text-zinc-600 mb-4">
          <i data-lucide="${isEmptyDatabase ? 'folder-open' : 'folder-minus'}" class="w-12 h-12"></i>
        </div>
        <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-200 font-display">
          ${isEmptyDatabase ? 'No tasks created yet' : 'No matching tasks found'}
        </h3>
        <p class="text-sm text-zinc-400 dark:text-zinc-500 max-w-sm mt-1 leading-relaxed">
          ${isEmptyDatabase ? 'Add a task above using the "Create Task" button to start organizing your schedule.' : 'Try broadening your search keyword or relaxing category/priority filters to view hidden items.'}
        </p>
        ${!isEmptyDatabase ? `
          <button onclick="resetAllFilters()" class="mt-5 flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            Reset Active Filters
          </button>
        ` : ''}
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // 4. Populate dynamic Task Cards
  processedTasks.forEach(task => {
    const isOverdue = (() => {
      if (!task.dueDate || task.completed) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    })();

    const priorityBadges = {
      High: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40',
      Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40',
      Low: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40'
    };

    const categoryBadges = {
      Work: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/40',
      Personal: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/40',
      Study: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40',
      Other: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/50'
    };

    const indicatorColor = 
      task.completed ? 'bg-zinc-300 dark:bg-zinc-700' :
      task.priority === 'High' ? 'bg-rose-500' :
      task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500';

    const creationDateString = new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const creationTimeString = new Date(task.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    let dueLabelHTML = `
      <div class="flex items-center gap-1 text-zinc-300 dark:text-zinc-700">
        <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
        <span>No due date</span>
      </div>
    `;

    if (task.dueDate) {
      const dueFormatted = new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const dueClass = task.completed ? 'text-zinc-450' : isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-zinc-500 dark:text-zinc-450';
      const icon = isOverdue && !task.completed ? 'alert-circle' : 'calendar';
      dueLabelHTML = `
        <div class="flex items-center gap-1.5 ${dueClass}">
          <i data-lucide="${icon}" class="w-3.5 h-3.5"></i>
          <span>Due: ${dueFormatted} ${isOverdue && !task.completed ? '(Overdue)' : ''}</span>
        </div>
      `;
    }

    const cardHTML = `
      <div class="group relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl border p-5 transition-all shadow-sm hover:shadow-md animate-fade-in-up ${task.completed ? 'border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/40 opacity-75' : isOverdue ? 'border-rose-300 dark:border-rose-900/50' : 'border-zinc-200 dark:border-zinc-800'}" id="card-${task.id}">
        
        <!-- Priority Left Anchor Strip -->
        <div class="absolute top-0 left-0 w-1.5 h-full transition-colors ${indicatorColor}"></div>
        
        <div class="pl-3 space-y-4">
          <!-- Top Row -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 flex-grow min-w-0">
              <!-- Checkbox -->
              <button onclick="toggleTaskCompletion('${task.id}')" class="flex-shrink-0 mt-0.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none">
                ${task.completed ? `
                  <div class="text-indigo-600 dark:text-indigo-400 relative">
                    <i data-lucide="check-circle-2" class="w-5 h-5 fill-indigo-50/30"></i>
                  </div>
                ` : `
                  <i data-lucide="circle" class="w-5 h-5 text-zinc-300 dark:text-zinc-600 hover:scale-110 transition-transform"></i>
                `}
              </button>

              <!-- Titles & Descs -->
              <div class="min-w-0 flex-grow">
                <h4 class="font-semibold text-base text-zinc-800 dark:text-zinc-100 transition-all ${task.completed ? 'line-through text-zinc-400 dark:text-zinc-500 font-normal' : ''}">
                  ${task.title}
                </h4>
                ${task.description ? `
                  <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-line line-clamp-3 ${task.completed ? 'line-through text-zinc-450 dark:text-zinc-650' : ''}">
                    ${task.description}
                  </p>
                ` : ''}
              </div>
            </div>

            <!-- Hover Action Buttons -->
            <div class="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button onclick="editTask('${task.id}')" class="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Edit Task">
                <i data-lucide="edit-2" class="w-4 h-4"></i>
              </button>
              <button onclick="requestTaskDeletion('${task.id}')" class="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Delete Task">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Badges -->
          <div class="flex flex-wrap gap-2 items-center">
            <span class="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${priorityBadges[task.priority]}">
              <span class="w-1.5 h-1.5 rounded-full ${task.priority === 'High' ? 'bg-rose-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}"></span>
              ${task.priority} Priority
            </span>

            <span class="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryBadges[task.category]}">
              <i data-lucide="bookmark" class="w-3.5 h-3.5"></i>
              ${task.category}
            </span>
          </div>

          <!-- Footer Metas -->
          <div class="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-450 dark:text-zinc-500 font-mono">
            <div class="flex items-center gap-1.5">
              <i data-lucide="clock" class="w-3.5 h-3.5"></i>
              <span>Created ${creationDateString} ${creationTimeString}</span>
            </div>
            ${dueLabelHTML}
          </div>
        </div>
      </div>
    `;
    tasksContainer.insertAdjacentHTML('beforeend', cardHTML);
  });

  lucide.createIcons();
}

// --- Active Tasks Interactions ---

// Toggle Complete Checked
window.toggleTaskCompletion = function(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveToLocalStorage();
    createToast(
      task.completed ? `"${task.title}" marked as Completed!` : `"${task.title}" set back to Pending.`,
      task.completed ? 'success' : 'info'
    );
  }
};

// Edit Task Trigger
window.editTask = function(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    editingTaskId = id;
    editTaskIdField.value = id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description;
    taskCategoryInput.value = task.category;
    taskPriorityInput.value = task.priority;
    taskDateInput.value = task.dueDate;
    openFormModal(true);
  }
};

// Delete Request Single
window.requestTaskDeletion = function(id) {
  openDeleteModal('single', id);
};

// Filter Reset Global Window Helper
window.resetAllFilters = function() {
  searchInput.value = '';
  filterCategory.value = 'All';
  filterPriority.value = 'All';
  sortSelect.value = 'newest';
  
  // Reset active status tabs visually
  activeStatusFilter = 'All';
  filterStatusAll.className = 'px-3 py-1 text-xs rounded-md transition-colors font-bold bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white';
  filterStatusCompleted.className = 'px-3 py-1 text-xs rounded-md transition-colors';
  filterStatusPending.className = 'px-3 py-1 text-xs rounded-md transition-colors';

  createToast('All filters cleared', 'info');
  renderTasks();
};

// --- Setup Event Listeners Routing ---
function setupEventListeners() {
  // Theme Toggle click
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Form Open Trigger
  openFormBtn.addEventListener('click', () => openFormModal(false));
  
  // Form Close Triggers
  closeFormBtn.addEventListener('click', closeFormModal);
  cancelFormBtn.addEventListener('click', closeFormModal);
  document.getElementById('form-modal-backdrop').addEventListener('click', closeFormModal);

  // Form Submit Handler
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = taskTitleInput.value.trim();
    const desc = taskDescInput.value.trim();
    const category = taskCategoryInput.value;
    const priority = taskPriorityInput.value;
    const dueDate = taskDateInput.value;

    // Validation
    if (!title) {
      validationError.classList.remove('hidden');
      return;
    }

    if (editingTaskId) {
      // Perform Edit
      const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          title,
          description: desc,
          category,
          priority,
          dueDate
        };
        createToast(`"${title}" saved successfully`, 'success');
      }
    } else {
      // Perform Add Task
      // Avoid Title Duplication in incomplete tasks
      const isDuplicate = tasks.some(t => t.title.toLowerCase().trim() === title.toLowerCase() && !t.completed);
      if (isDuplicate) {
        createToast('An incomplete task with this title already exists!', 'warning');
        return;
      }

      const newTask = {
        id: `task-${Date.now()}`,
        title,
        description: desc,
        category,
        priority,
        dueDate,
        createdAt: new Date().toISOString(),
        completed: false
      };
      
      tasks.unshift(newTask);
      createToast(`Created task "${title}"`, 'success');
    }

    saveToLocalStorage();
    closeFormModal();
  });

  // Filters Events
  searchInput.addEventListener('input', renderTasks);
  sortSelect.addEventListener('change', renderTasks);
  filterCategory.addEventListener('change', renderTasks);
  filterPriority.addEventListener('change', renderTasks);

  // Status Filter tabs handlers
  filterStatusAll.addEventListener('click', () => {
    activeStatusFilter = 'All';
    filterStatusAll.className = 'px-3 py-1 text-xs rounded-md transition-colors font-bold bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white';
    filterStatusCompleted.className = 'px-3 py-1 text-xs rounded-md transition-colors';
    filterStatusPending.className = 'px-3 py-1 text-xs rounded-md transition-colors';
    renderTasks();
  });

  filterStatusCompleted.addEventListener('click', () => {
    activeStatusFilter = 'Completed';
    filterStatusAll.className = 'px-3 py-1 text-xs rounded-md transition-colors';
    filterStatusCompleted.className = 'px-3 py-1 text-xs rounded-md transition-colors font-bold bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white';
    filterStatusPending.className = 'px-3 py-1 text-xs rounded-md transition-colors';
    renderTasks();
  });

  filterStatusPending.addEventListener('click', () => {
    activeStatusFilter = 'Pending';
    filterStatusAll.className = 'px-3 py-1 text-xs rounded-md transition-colors';
    filterStatusCompleted.className = 'px-3 py-1 text-xs rounded-md transition-colors';
    filterStatusPending.className = 'px-3 py-1 text-xs rounded-md transition-colors font-bold bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white';
    renderTasks();
  });

  resetFiltersBtn.addEventListener('click', resetAllFilters);

  // Bulk Deletions Click
  clearCompletedBtn.addEventListener('click', () => {
    const hasCompleted = tasks.some(t => t.completed);
    if (!hasCompleted) {
      createToast('No completed tasks to clear!', 'warning');
      return;
    }
    openDeleteModal('completed');
  });

  clearAllBtn.addEventListener('click', () => {
    if (tasks.length === 0) {
      createToast('No tasks exist to delete!', 'warning');
      return;
    }
    openDeleteModal('all');
  });

  // Delete Modal Confirmation Button routes
  cancelDeleteBtn.addEventListener('click', closeDeleteModalDialog);
  closeDeleteModal.addEventListener('click', closeDeleteModalDialog);
  document.getElementById('delete-modal-backdrop').addEventListener('click', closeDeleteModalDialog);

  confirmDeleteBtn.addEventListener('click', () => {
    if (deleteActionType === 'single' && taskToDeleteId) {
      const task = tasks.find(t => t.id === taskToDeleteId);
      tasks = tasks.filter(t => t.id !== taskToDeleteId);
      createToast(`Deleted "${task ? task.title : 'Task'}"`, 'error');
    } else if (deleteActionType === 'completed') {
      tasks = tasks.filter(t => !t.completed);
      createToast('Cleared all completed tasks', 'success');
    } else if (deleteActionType === 'all') {
      tasks = [];
      createToast('Successfully deleted all tasks', 'error');
    }

    saveToLocalStorage();
    closeDeleteModalDialog();
  });
}

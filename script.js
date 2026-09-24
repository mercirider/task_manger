/* ═══════════════════════════════════════════
   TASK MANAGER PRO — Main Logic
   ═══════════════════════════════════════════ */

/* ---------- State ---------- */
let tasks = [];
let currentFilter = 'all';
let currentCategoryFilter = null;
let currentSort = 'date';
let editingTaskId = null;

/* ---------- Constants ---------- */
const CATEGORY_COLORS = {
  personal: '#8b5cf6',
  work: '#3b82f6',
  study: '#10b981',
  shopping: '#f59e0b',
  health: '#ef4444'
};

const CATEGORY_EMOJI = {
  personal: '👤',
  work: '💼',
  study: '📚',
  shopping: '🛒',
  health: '💊'
};

/* ---------- DOM Elements ---------- */
const els = {
  sidebar: document.getElementById('sidebar'),
  menuBtn: document.getElementById('menuBtn'),
  tasksList: document.getElementById('tasksList'),
  emptyState: document.getElementById('emptyState'),
  taskInput: document.getElementById('taskInput'),
  addTaskBtn: document.getElementById('addTaskBtn'),
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),
  sectionTitle: document.getElementById('sectionTitle'),

  totalTasks: document.getElementById('totalTasks'),
  completedTasks: document.getElementById('completedTasks'),
  pendingTasks: document.getElementById('pendingTasks'),
  overdueTasks: document.getElementById('overdueTasks'),

  countAll: document.getElementById('countAll'),
  countToday: document.getElementById('countToday'),
  countImportant: document.getElementById('countImportant'),
  countCompleted: document.getElementById('countCompleted'),

  categoriesList: document.getElementById('categoriesList'),
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.getElementById('themeIcon'),
  themeText: document.getElementById('themeText'),
  clearAllBtn: document.getElementById('clearAllBtn'),

  editModal: document.getElementById('editModal'),
  closeEditModal: document.getElementById('closeEditModal'),
  cancelEdit: document.getElementById('cancelEdit'),
  saveEdit: document.getElementById('saveEdit'),
  editTitle: document.getElementById('editTitle'),
  editDueDate: document.getElementById('editDueDate'),
  editCategory: document.getElementById('editCategory'),
  editPriority: document.getElementById('editPriority'),

  toast: document.getElementById('toast'),

  advancedOptions: document.getElementById('advancedOptions'),
  dueDate: document.getElementById('dueDate'),
  category: document.getElementById('category'),
  priority: document.getElementById('priority')
};

/* ═══════════ LOCAL STORAGE ═══════════ */
function saveTasks() {
  localStorage.setItem('taskManagerPro', JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const saved = localStorage.getItem('taskManagerPro');
    tasks = saved ? JSON.parse(saved) : [];
  } catch (e) {
    tasks = [];
  }
}

function saveTheme() {
  localStorage.setItem('taskManagerTheme', document.body.classList.contains('light') ? 'light' : 'dark');
}

function loadTheme() {
  const theme = localStorage.getItem('taskManagerTheme') || 'dark';
  if (theme === 'light') {
    document.body.classList.add('light');
    els.themeIcon.textContent = '☀️';
    els.themeText.textContent = 'Light Mode';
  }
}

/* ═══════════ UTILS ═══════════ */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) return 'Today';
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';

  const diffDays = Math.round((dateOnly - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays <= 7) return `In ${diffDays} days`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  els.toast.textContent = message;
  els.toast.className = 'toast show ' + type;
  setTimeout(() => {
    els.toast.classList.remove('show');
  }, 2800);
}

/* ═══════════ TASK OPERATIONS ═══════════ */
function addTask() {
  const title = els.taskInput.value.trim();
  if (!title) {
    showToast('⚠️ Task title likho pehle!', 'error');
    els.taskInput.focus();
    return;
  }

  const task = {
    id: generateId(),
    title: title,
    completed: false,
    important: false,
    category: els.category.value,
    priority: els.priority.value,
    dueDate: els.dueDate.value || null,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(task);
  saveTasks();

  els.taskInput.value = '';
  els.dueDate.value = '';
  els.priority.value = 'medium';

  render();
  showToast('✅ Task add ho gaya!', 'success');
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    render();
    if (task.completed) {
      showToast('🎉 Task complete!', 'success');
    }
  }
}

function toggleImportant(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.important = !task.important;
    saveTasks();
    render();
  }
}

function deleteTask(id) {
  if (!confirm('Yeh task delete karna chahte ho?')) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
  showToast('🗑️ Task delete ho gaya', 'info');
}

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  editingTaskId = id;
  els.editTitle.value = task.title;
  els.editDueDate.value = task.dueDate || '';
  els.editCategory.value = task.category;
  els.editPriority.value = task.priority;
  els.editModal.classList.add('show');
  els.editTitle.focus();
}

function saveEdit() {
  const task = tasks.find(t => t.id === editingTaskId);
  if (!task) return;

  const newTitle = els.editTitle.value.trim();
  if (!newTitle) {
    showToast('⚠️ Title khali nahi ho sakta', 'error');
    return;
  }

  task.title = newTitle;
  task.dueDate = els.editDueDate.value || null;
  task.category = els.editCategory.value;
  task.priority = els.editPriority.value;

  saveTasks();
  closeEditModal();
  render();
  showToast('💾 Changes save ho gaye!', 'success');
}

function closeEditModal() {
  els.editModal.classList.remove('show');
  editingTaskId = null;
}

function clearAll() {
  if (tasks.length === 0) {
    showToast('Koi task nahi hai clear karne ke liye', 'info');
    return;
  }
  if (!confirm('Saare tasks delete karne hain? Yeh undo nahi hoga!')) return;
  tasks = [];
  saveTasks();
  render();
  showToast('🗑️ Sab tasks clear!', 'info');
}

/* ═══════════ FILTER & SORT ═══════════ */
function getFilteredTasks() {
  let filtered = [...tasks];

  // Filter by nav
  if (currentFilter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  } else if (currentFilter === 'today') {
    filtered = filtered.filter(t => isToday(t.dueDate) && !t.completed);
  } else if (currentFilter === 'important') {
    filtered = filtered.filter(t => t.important && !t.completed);
  } else if (currentFilter === 'all') {
    // all includes everything
  }

  // Filter by category
  if (currentCategoryFilter) {
    filtered = filtered.filter(t => t.category === currentCategoryFilter);
  }

  // Search
  const query = els.searchInput.value.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query)
    );
  }

  // Sort
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  if (currentSort === 'date') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (currentSort === 'due') {
    filtered.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else if (currentSort === 'priority') {
    filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  } else if (currentSort === 'alpha') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Completed at bottom
  filtered.sort((a, b) => Number(a.completed) - Number(b.completed));

  return filtered;
}

/* ═══════════ RENDER ═══════════ */
function render() {
  renderTasks();
  renderStats();
  renderCategories();
}

function renderTasks() {
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    els.tasksList.innerHTML = '';
    els.emptyState.classList.add('show');
    return;
  }

  els.emptyState.classList.remove('show');
  els.tasksList.innerHTML = filtered.map(task => createTaskHTML(task)).join('');

  // Attach listeners
  filtered.forEach(task => {
    const el = document.querySelector(`[data-id="${task.id}"]`);
    if (!el) return;

    el.querySelector('.task-checkbox').addEventListener('click', () => toggleTask(task.id));
    el.querySelector('.edit-btn')?.addEventListener('click', () => openEditModal(task.id));
    el.querySelector('.delete-btn')?.addEventListener('click', () => deleteTask(task.id));
    el.querySelector('.star')?.addEventListener('click', () => toggleImportant(task.id));

    // Drag & drop
    el.setAttribute('draggable', true);
    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleDrop);
    el.addEventListener('dragend', handleDragEnd);
  });
}

function createTaskHTML(task) {
  const dueClass = task.dueDate
    ? (isOverdue(task.dueDate) ? 'overdue' : (isToday(task.dueDate) ? 'today' : ''))
    : '';

  const dueHtml = task.dueDate
    ? `<span class="task-tag tag-due ${dueClass}">📅 ${formatDate(task.dueDate)}</span>`
    : '';

  const categoryHtml = `<span class="task-tag tag-category">${CATEGORY_EMOJI[task.category] || '🏷️'} ${task.category}</span>`;
  const priorityHtml = `<span class="task-tag tag-priority-${task.priority}">⚡ ${task.priority}</span>`;

  return `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}" data-priority="${task.priority}">
      <button class="task-checkbox ${task.completed ? 'checked' : ''}">${task.completed ? '✓' : ''}</button>
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          ${categoryHtml}
          ${dueHtml}
          ${priorityHtml}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn star ${task.important ? 'active' : ''}" title="Important">${task.important ? '⭐' : '☆'}</button>
        <button class="icon-btn edit edit-btn" title="Edit">✏️</button>
        <button class="icon-btn delete delete-btn" title="Delete">🗑️</button>
      </div>
    </div>
  `;
}

function renderStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter(t => t.dueDate && isOverdue(t.dueDate) && !t.completed).length;

  els.totalTasks.textContent = total;
  els.completedTasks.textContent = completed;
  els.pendingTasks.textContent = pending;
  els.overdueTasks.textContent = overdue;

  els.countAll.textContent = total;
  els.countCompleted.textContent = completed;
  els.countToday.textContent = tasks.filter(t => isToday(t.dueDate) && !t.completed).length;
  els.countImportant.textContent = tasks.filter(t => t.important && !t.completed).length;
}

function renderCategories() {
  const cats = ['personal', 'work', 'study', 'shopping', 'health'];
  els.categoriesList.innerHTML = cats.map(cat => {
    const count = tasks.filter(t => t.category === cat && !t.completed).length;
    const active = currentCategoryFilter === cat ? 'active' : '';
    return `
      <div class="cat-item ${active}" data-cat="${cat}">
        <span class="cat-dot cat-${cat}"></span>
        <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
        <span class="nav-count" style="margin-left: auto;">${count}</span>
      </div>
    `;
  }).join('');

  els.categoriesList.querySelectorAll('.cat-item').forEach(item => {
    item.addEventListener('click', () => {
      const cat = item.dataset.cat;
      currentCategoryFilter = currentCategoryFilter === cat ? null : cat;
      currentFilter = 'all';
      document.querySelectorAll('.nav-item[data-filter]').forEach(b => b.classList.remove('active'));
      els.sectionTitle.textContent = currentCategoryFilter
        ? `${currentCategoryFilter.charAt(0).toUpperCase() + currentCategoryFilter.slice(1)} Tasks`
        : 'All Tasks';
      render();
    });
  });
}

/* ═══════════ DRAG & DROP ═══════════ */
let draggedId = null;

function handleDragStart(e) {
  draggedId = this.dataset.id;
  this.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
  if (this.dataset.id !== draggedId) {
    this.classList.add('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  const targetId = this.dataset.id;

  if (draggedId === targetId) return;

  const draggedIdx = tasks.findIndex(t => t.id === draggedId);
  const targetIdx = tasks.findIndex(t => t.id === targetId);

  if (draggedIdx === -1 || targetIdx === -1) return;

  const [moved] = tasks.splice(draggedIdx, 1);
  tasks.splice(targetIdx, 0, moved);

  saveTasks();
  render();
}

function handleDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.task-item').forEach(el => el.classList.remove('drag-over'));
}

/* ═══════════ EVENT LISTENERS ═══════════ */
els.addTaskBtn.addEventListener('click', addTask);

els.taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

els.searchInput.addEventListener('input', render);
els.sortSelect.addEventListener('change', (e) => {
  currentSort = e.target.value;
  render();
});

document.querySelectorAll('.nav-item[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item[data-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    currentCategoryFilter = null;
    els.sectionTitle.textContent = {
      all: 'All Tasks',
      today: 'Today\'s Tasks',
      important: 'Important Tasks',
      completed: 'Completed Tasks'
    }[currentFilter];
    render();
  });
});

els.menuBtn.addEventListener('click', () => {
  els.sidebar.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (window.innerWidth <= 900 && !els.sidebar.contains(e.target) && !els.menuBtn.contains(e.target)) {
    els.sidebar.classList.remove('open');
  }
});

els.themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  els.themeIcon.textContent = isLight ? '☀️' : '🌙';
  els.themeText.textContent = isLight ? 'Light Mode' : 'Dark Mode';
  saveTheme();
});

els.clearAllBtn.addEventListener('click', clearAll);

// Modal
els.closeEditModal.addEventListener('click', closeEditModal);
els.cancelEdit.addEventListener('click', closeEditModal);
els.saveEdit.addEventListener('click', saveEdit);
els.editModal.addEventListener('click', (e) => {
  if (e.target === els.editModal) closeEditModal();
});
els.editTitle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveEdit();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeEditModal();
});

/* ═══════════ INIT ═══════════ */
function init() {
  loadTasks();
  loadTheme();
  render();

  // Welcome toast if first time
  if (tasks.length === 0) {
    setTimeout(() => showToast('👋 Welcome to Task Manager Pro!', 'info'), 500);
  }
}

init();
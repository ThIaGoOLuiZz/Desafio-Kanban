// DOM Elements
const addTaskBtn = document.getElementById('add-task-btn');
const clearBoardBtn = document.getElementById('clear-board-btn');
const taskModal = document.getElementById('task-modal');
const closeModal = document.querySelector('.close');
const taskForm = document.getElementById('task-form');
const taskContainers = document.querySelectorAll('.tasks-container');
const columns = document.querySelectorAll('.column');
const taskCounts = document.querySelectorAll('.task-count');
const modalTitle = document.querySelector('#task-modal h2');
const submitBtn = document.querySelector('.submit-btn');
const commentsList = document.getElementById('comments-list');
const newCommentInput = document.getElementById('new-comment');
const addCommentBtn = document.getElementById('add-comment-btn');

// Local Storage Key
const TASKS_STORAGE_KEY = 'kanban_tasks';

// Current user info - in a real app this would come from authentication
const currentUser = {
    id: 'user-self',
    name: 'You',
    avatar: 'S'
};

// Mock users for realistic comments
const users = {
    'user1': { name: 'João Silva', avatar: 'JS' },
    'user2': { name: 'Maria Santos', avatar: 'MS' },
    'user3': { name: 'Carlos Oliveira', avatar: 'CO' },
    'user4': { name: 'Ana Souza', avatar: 'AS' }
};

// Task Data Structure
let tasks = {
    'todo': [],
    'in-progress': [],
    'done': []
};

// Track if we're editing a task
let currentEditTaskId = null;
let currentEditTaskColumn = null;

// Load tasks from localStorage
function loadTasks() {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
        renderTasks();
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    updateTaskCounts();
}

// Clear all tasks
function clearAllTasks() {
    if (confirm('Are you sure you want to clear all tasks? This action cannot be undone.')) {
        tasks = {
            'todo': [],
            'in-progress': [],
            'done': []
        };
        saveTasks();
        renderTasks();
    }
}

// Generate unique ID for tasks and comments
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

// Format time for display
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Reset modal for new task
function resetModalForNewTask() {
    modalTitle.textContent = 'Add New Task';
    submitBtn.textContent = 'Add Task';
    taskForm.reset();
    commentsList.innerHTML = '<div class="no-comments">No comments yet</div>';
    currentEditTaskId = null;
    currentEditTaskColumn = null;
}

// Open task modal for adding new task
addTaskBtn.addEventListener('click', () => {
    resetModalForNewTask();
    taskModal.classList.add('show');
    document.getElementById('task-title').focus();
});

// Clear all tasks
clearBoardBtn.addEventListener('click', clearAllTasks);

// Close task modal
closeModal.addEventListener('click', () => {
    taskModal.classList.remove('show');
    taskForm.reset();
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === taskModal) {
        taskModal.classList.remove('show');
        taskForm.reset();
    }
});

// Render comments for a task
function renderComments(comments = []) {
    if (!comments || comments.length === 0) {
        commentsList.innerHTML = '<div class="no-comments">No comments yet</div>';
        return;
    }
    
    commentsList.innerHTML = '';
    
    // Sort comments by date (oldest first to maintain chronological order)
    const sortedComments = [...comments].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    sortedComments.forEach(comment => {
        const commentEl = document.createElement('div');
        commentEl.className = `comment ${comment.userId === currentUser.id ? 'self' : ''}`;
        
        // Get user info
        const user = comment.userId === currentUser.id 
            ? currentUser 
            : (users[comment.userId] || { name: comment.userName || 'Unknown User', avatar: 'U' });
        
        const date = new Date(comment.timestamp);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth() && 
                       date.getFullYear() === today.getFullYear();
        
        const timeDisplay = isToday 
            ? formatTime(comment.timestamp) 
            : `${formatDate(comment.timestamp)} ${formatTime(comment.timestamp)}`;
        
        commentEl.innerHTML = `
            <div class="comment-avatar">${user.avatar}</div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${user.name}</span>
                    <span class="comment-time">${timeDisplay}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `;
        
        commentsList.appendChild(commentEl);
    });
    
    // Scroll to bottom of comments
    commentsList.scrollTop = commentsList.scrollHeight;
}

// Add a new comment
function addComment(text) {
    if (!text.trim() || !currentEditTaskId) return;
    
    const taskIndex = tasks[currentEditTaskColumn].findIndex(task => task.id === currentEditTaskId);
    if (taskIndex === -1) return;
    
    const task = tasks[currentEditTaskColumn][taskIndex];
    
    // Initialize comments array if it doesn't exist
    if (!task.comments) {
        task.comments = [];
    }
    
    // Add new comment
    const newComment = {
        id: generateId(),
        userId: currentUser.id,
        userName: currentUser.name,
        text: text.trim(),
        timestamp: new Date().toISOString()
    };
    
    task.comments.push(newComment);
    
    // Save tasks and rerender comments
    saveTasks();
    renderComments(task.comments);
    
    // Clear input
    newCommentInput.value = '';
}

// Add comment button click event
addCommentBtn.addEventListener('click', () => {
    addComment(newCommentInput.value);
});

// Add comment on enter key (but shift+enter for new line)
newCommentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addComment(newCommentInput.value);
    }
});

// Add or update task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const priority = document.getElementById('task-priority').value;
    const type = document.getElementById('task-type').value;
    const responsible = document.getElementById('task-responsible').value;
    const status = document.getElementById('task-status').value;
    const expiration = document.getElementById('task-expiration').value;
    const team = document.getElementById('task-team').value;
    
    if (!title.trim()) return;
    
    if (currentEditTaskId) {
        // Update existing task
        const taskIndex = tasks[currentEditTaskColumn].findIndex(task => task.id === currentEditTaskId);
        if (taskIndex !== -1) {
            const updatedTask = {
                ...tasks[currentEditTaskColumn][taskIndex],
                title,
                description,
                priority,
                type,
                responsible,
                team,
                expiration,
                updatedAt: new Date().toISOString(),
                comments: tasks[currentEditTaskColumn][taskIndex].comments || [] // Preserve comments array
            };
            
            // Remove from current column if status changed
            if (status !== currentEditTaskColumn) {
                tasks[currentEditTaskColumn].splice(taskIndex, 1);
                tasks[status].unshift(updatedTask);
            } else {
                tasks[currentEditTaskColumn][taskIndex] = updatedTask;
            }
        }
    } else {
        // Add new task
        const newTask = {
            id: generateId(),
            title,
            description,
            priority,
            type,
            responsible,
            status,
            expiration,
            team,
            comments: [],
            createdAt: new Date().toISOString()
        };
        
        tasks[status].unshift(newTask);
    }
    
    saveTasks();
    renderTasks();
    
    taskModal.classList.remove('show');
    taskForm.reset();
    currentEditTaskId = null;
    currentEditTaskColumn = null;
});

// Open task for editing
function openTaskForEdit(task, columnId) {
    currentEditTaskId = task.id;
    currentEditTaskColumn = columnId;
    
    // Populate form with task data
    document.getElementById('task-title').value = task.title || '';
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-priority').value = task.priority || 'medium';
    document.getElementById('task-type').value = task.type || '';
    document.getElementById('task-responsible').value = task.responsible || '';
    document.getElementById('task-status').value = columnId;
    document.getElementById('task-expiration').value = task.expiration || '';
    document.getElementById('task-team').value = task.team || '';
    
    // Render comments
    renderComments(task.comments || []);
    
    // Update modal UI for editing
    modalTitle.textContent = 'Edit Task';
    submitBtn.textContent = 'Update Task';
    
    // Show modal
    taskModal.classList.add('show');
}

// Create task HTML element
function createTaskElement(task, columnId) {
    const taskElement = document.createElement('div');
    taskElement.className = `task ${task.priority}-priority`;
    taskElement.setAttribute('draggable', 'true');
    taskElement.setAttribute('data-id', task.id);
    
    const date = new Date(task.createdAt);
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    
    // Show updated date if available
    let dateInfo = `Created: ${formattedDate}`;
    if (task.updatedAt) {
        const updatedDate = new Date(task.updatedAt);
        const formattedUpdatedDate = `${updatedDate.getDate()}/${updatedDate.getMonth() + 1}/${updatedDate.getFullYear()}`;
        dateInfo = `Updated: ${formattedUpdatedDate}`;
    }
    
    // Format expiration date if it exists
    let expirationHTML = '';
    if (task.expiration) {
        const expirationDate = new Date(task.expiration);
        const today = new Date();
        const isExpired = expirationDate < today;
        
        expirationHTML = `
            <div class="expiration-date ${isExpired ? 'expired' : ''}">
                <i class="fas fa-calendar-alt"></i> 
                ${expirationDate.getDate()}/${expirationDate.getMonth() + 1}/${expirationDate.getFullYear()}
            </div>
        `;
    }
    
    // Get responsible user name
    let responsibleName = '';
    const responsibleSelect = document.getElementById('task-responsible');
    if (task.responsible && responsibleSelect) {
        const option = Array.from(responsibleSelect.options).find(opt => opt.value === task.responsible);
        responsibleName = option ? option.text : task.responsible;
    }
    
    // Get team name
    let teamName = '';
    const teamSelect = document.getElementById('task-team');
    if (task.team && teamSelect) {
        const option = Array.from(teamSelect.options).find(opt => opt.value === task.team);
        teamName = option ? option.text : task.team;
    }
    
    // Get type name
    let typeName = '';
    const typeSelect = document.getElementById('task-type');
    if (task.type && typeSelect) {
        const option = Array.from(typeSelect.options).find(opt => opt.value === task.type);
        typeName = option ? option.text : task.type;
    }
    
    // Priority label text
    let priorityText = 'Medium';
    if (task.priority === 'low') priorityText = 'Low';
    if (task.priority === 'high') priorityText = 'High';
    
    // Comments indicator
    let commentsIndicator = '';
    if (task.comments && task.comments.length > 0) {
        commentsIndicator = `<div class="task-comments-indicator"><i class="fas fa-comment"></i> ${task.comments.length}</div>`;
    }
    
    taskElement.innerHTML = `
        <h4>${task.title}</h4>
        <p>${task.description || 'No description'}</p>
        
        <div class="task-details">
            ${typeName ? `<div class="task-type"><i class="fas fa-tools"></i> ${typeName}</div>` : ''}
            ${responsibleName ? `<div class="task-responsible"><i class="fas fa-user"></i> ${responsibleName}</div>` : ''}
            ${teamName ? `<div class="task-team"><i class="fas fa-users"></i> ${teamName}</div>` : ''}
            ${expirationHTML}
            ${commentsIndicator}
        </div>
        
        <div class="task-meta">
            <span>${dateInfo}</span>
            <span class="priority-badge ${task.priority}">${priorityText}</span>
        </div>
    `;
    
    // Add click event to edit task
    taskElement.addEventListener('click', (e) => {
        // Don't trigger edit when dragging
        if (!isDragging) {
            openTaskForEdit(task, columnId);
        }
    });
    
    // Add drag event listeners
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);
    
    return taskElement;
}

// Render all tasks
function renderTasks() {
    // Clear all task containers
    taskContainers.forEach(container => {
        container.innerHTML = '';
    });
    
    // Render tasks in each column
    for (const [column, columnTasks] of Object.entries(tasks)) {
        const container = document.getElementById(`${column}-tasks`);
        if (!container) continue;
        
        columnTasks.forEach(task => {
            container.appendChild(createTaskElement(task, column));
        });
    }
    
    updateTaskCounts();
}

// Update task count badges
function updateTaskCounts() {
    for (const [column, columnTasks] of Object.entries(tasks)) {
        const countElement = document.querySelector(`#${column} .task-count`);
        if (countElement) {
            countElement.textContent = columnTasks.length;
        }
    }
}

// Drag and Drop Functionality
let draggedTask = null;
let isDragging = false;

function handleDragStart(e) {
    draggedTask = this;
    isDragging = true;
    
    setTimeout(() => {
        this.classList.add('dragging');
    }, 0);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
}

function handleDragEnd() {
    this.classList.remove('dragging');
    
    // Remove drop zone styling from all columns
    columns.forEach(column => {
        column.querySelector('.tasks-container').classList.remove('drop-zone');
    });
    
    // Reset dragging state after a short delay to prevent click event from firing
    setTimeout(() => {
        isDragging = false;
    }, 100);
}

// Add drag and drop event listeners to columns
taskContainers.forEach(container => {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragenter', handleDragEnter);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);
});

function handleDragOver(e) {
    e.preventDefault();
    return false;
}

function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drop-zone');
}

function handleDragLeave() {
    this.classList.remove('drop-zone');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drop-zone');
    
    if (!draggedTask) return;
    
    const taskId = e.dataTransfer.getData('text/plain');
    const sourceColumnId = draggedTask.parentElement.id.replace('-tasks', '');
    const targetColumnId = this.id.replace('-tasks', '');
    
    if (sourceColumnId === targetColumnId) return;
    
    // Find task in source column
    const taskIndex = tasks[sourceColumnId].findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    // Move task to target column
    const task = tasks[sourceColumnId].splice(taskIndex, 1)[0];
    tasks[targetColumnId].unshift(task);
    
    saveTasks();
    renderTasks();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load any existing tasks from localStorage
    loadTasks();
    
    // Add a sample task with comments if no tasks exist (for demo purposes)
    addSampleTaskIfEmpty();
});

// Add a sample task with comments for testing purposes
function addSampleTaskIfEmpty() {
    if (Object.values(tasks).every(column => column.length === 0)) {
        const sampleTask = {
            id: generateId(),
            title: 'Manutenção do servidor principal',
            description: 'Realizar manutenção preventiva no servidor principal do datacenter',
            priority: 'high',
            type: 'preventive',
            responsible: 'user3',
            status: 'in-progress',
            expiration: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days from now
            team: 'team3',
            comments: [
                {
                    id: 'comment-1',
                    userId: 'user1',
                    userName: 'João Silva',
                    text: 'Conforme a solicitação, agendei a manutenção preventiva para a próxima sexta-feira às 22h. Precisaremos coordenar com a equipe de infraestrutura para garantir o mínimo de impacto nos serviços.',
                    timestamp: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
                },
                {
                    id: 'comment-2',
                    userId: 'user3',
                    userName: 'Carlos Oliveira',
                    text: 'Todos os backups foram verificados e estão em dia. O procedimento padrão de manutenção preventiva foi atualizado com as novas recomendações do fabricante. Podemos proceder conforme planejado.',
                    timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                },
                {
                    id: 'comment-3',
                    userId: 'user4',
                    userName: 'Ana Souza',
                    text: 'Por favor, verificar se temos todas as peças de reposição necessárias em estoque, especialmente os ventiladores e as fontes de alimentação redundantes, conforme observado na última inspeção de hardware.',
                    timestamp: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
                },
                {
                    id: 'comment-4',
                    userId: 'user-self',
                    userName: 'You',
                    text: 'Inventário de peças concluído: temos todas as peças necessárias em estoque, incluindo 2 fontes redundantes e 4 ventiladores. Também separei componentes extras por precaução. O checklist de manutenção foi impresso e está pronto para uso.',
                    timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
                }
            ],
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
        };
        
        tasks['in-progress'].push(sampleTask);
        saveTasks();
    }
} 
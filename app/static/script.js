/**
 * TaskFlow - Modern Task Manager
 * Enhanced JavaScript with Dark Mode, Statistics, Filters, and Priority Management
 */

// Automatically detect the API URL (works on localhost and production)
const API_URL = window.location.origin;
let isLoginMode = true;
let allTasks = [];
let currentFilter = 'all';

/**
 * Initialize Application
 */
document.addEventListener("DOMContentLoaded", () => {


    // Enforce Clean URL: Remove 'index.html' or '/static/' from address bar
    if (window.location.pathname.includes('index.html') || window.location.pathname.includes('/static/')) {
        window.history.replaceState({}, '', '/');
    }

    const token = localStorage.getItem("token");
    if (token) {
        showTodoSection();

        // Handle deep linking / redirects
        const navTarget = sessionStorage.getItem('navigateTo');
        if (navTarget === 'profile') {
            sessionStorage.removeItem('navigateTo');
            showProfileSection();
        }
    }

    // Load theme preference
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon();

    // Start idle timer
    startIdleTimer();
});

/**
 * Idle Timer for Auto Logout
 */
let idleTimer;
const IDLE_TIMEOUT = 60 * 1000; // 1 minute in milliseconds

function startIdleTimer() {
    // Reset timer on any activity
    window.onload = resetTimer;
    window.onmousemove = resetTimer;
    window.onmousedown = resetTimer;
    window.ontouchstart = resetTimer;
    window.onclick = resetTimer;
    window.onkeypress = resetTimer;
    window.addEventListener('scroll', resetTimer, true);

    // Initial start
    resetTimer();
}

function resetTimer() {
    clearTimeout(idleTimer);
    // Only set timer if user is logged in
    if (localStorage.getItem("token")) {
        idleTimer = setTimeout(logout, IDLE_TIMEOUT);
    }
}

/**
 * Dark Mode Toggle
 */
function toggleDarkMode() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeIcon = document.querySelector(".theme-icon");
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (themeIcon) {
        themeIcon.textContent = currentTheme === "light" ? "🌙" : "☀️";
    }
}

/**
 * Authentication UI Toggle
 */
function toggleAuthMode(forceMode = null) {
    if (forceMode !== null) {
        isLoginMode = forceMode;
    } else {
        isLoginMode = !isLoginMode;
    }

    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");
    const emailWrapper = document.getElementById("emailWrapper");
    const btn = document.getElementById("authBtn");
    const toggleText = document.getElementById("toggleText");
    const toggleLink = document.getElementById("toggleLink");

    // Clear inputs
    document.getElementById("username").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";

    if (isLoginMode) {
        title.innerText = "Welcome to TaskFlow";
        subtitle.innerText = "Sign in to manage your tasks efficiently";
        emailWrapper.style.display = "none";
        btn.innerHTML = "Sign In";
        toggleText.innerText = "Don't have an account?";
        toggleLink.innerText = "Create one";
    } else {
        title.innerText = "Create Your Account";
        subtitle.innerText = "Join TaskFlow to boost your productivity";
        emailWrapper.style.display = "block";
        btn.innerHTML = "Create Account";
        toggleText.innerText = "Already have an account?";
        toggleLink.innerText = "Sign in";
    }
}

/**
 * Master Auth Handler
 */
async function handleAuthAction() {
    const btn = document.getElementById("authBtn");
    const originalText = btn.innerHTML;

    btn.innerHTML = "Processing...";
    btn.disabled = true;

    try {
        if (isLoginMode) {
            await login();
        } else {
            await register();
        }
    } catch (error) {
        console.error("Authentication Error:", error);
    } finally {
        btn.disabled = false;
        btn.innerHTML = isLoginMode ? "Sign In" : "Create Account";
    }
}

/**
 * Toggle Password Visibility
 */
function togglePassword() {
    const passwordInput = document.getElementById("password");
    const icon = document.querySelector(".password-toggle .eye-icon");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        icon.textContent = "🙈"; // Hide icon
    } else {
        passwordInput.type = "password";
        icon.textContent = "👁️"; // Show icon
    }
}

/**
 * User Registration
 */
async function register() {
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const username = usernameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;

    // Reset errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.input-wrapper').forEach(el => el.classList.remove('error'));

    let hasError = false;

    // Client-side validation
    if (!username) {
        showError('username', 'Username is required');
        hasError = true;
    }
    // Password check
    if (!password) {
        showError('password', 'Password is required');
        hasError = true;
    } else {
        if (password.length < 8) {
            showError('password', 'Password must be at least 8 characters');
            hasError = true;
        } else if (!/\d/.test(password)) {
            showError('password', 'Password must contain a number');
            hasError = true;
        } else if (!/[a-zA-Z]/.test(password)) {
            showError('password', 'Password must contain a letter');
            hasError = true;
        }
    }

    if (hasError) return;

    try {
        const response = await fetch(`${API_URL}/auth/register/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Success
            alert("Registration Successful! Please Login."); // Keeping success alert or changing to toast? 
            // User requested "professional", but success alert is okay-ish. 
            // Better: Switch to login and show success message there?
            // Existing logic: alert then toggleAuthMode(true).
            toggleAuthMode(true);
            // Optionally autofill login?
        } else {
            // Handle Errors
            if (Array.isArray(data.detail)) {
                data.detail.forEach(err => {
                    const field = err.loc[err.loc.length - 1];
                    // Map backend field names to IDs if necessary
                    let targetField = field;
                    if (field === 'hashed_password') targetField = 'password';

                    showError(targetField, err.msg);
                });
            } else {
                // General error (e.g., "User already exists")
                // Try to determine field or show generic
                const errorMsg = data.detail.toLowerCase();
                if (errorMsg.includes("username")) {
                    showError('username', data.detail);
                } else if (errorMsg.includes("mail")) {
                    showError('email', data.detail);
                } else {
                    alert(data.detail || "Registration failed. Please try again.");
                }
            }
        }
    } catch (err) {
        console.error("Registration Error:", err);
        alert("Server connection failed. Is your backend running?");
    }
}

function showError(fieldId, message) {
    const errorDiv = document.getElementById(`error-${fieldId}`);
    const input = document.getElementById(fieldId);

    if (errorDiv) {
        errorDiv.textContent = message;
    }
    if (input) {
        const wrapper = input.closest('.input-wrapper');
        if (wrapper) wrapper.classList.add('error');
    }
}

/**
 * User Login
 */
async function login() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    const username = usernameInput.value;
    const password = passwordInput.value;

    // Reset errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.input-wrapper').forEach(el => el.classList.remove('error'));

    let hasError = false;

    if (!username) {
        showError('username', 'Username is required');
        hasError = true;
    }
    if (!password) {
        showError('password', 'Password is required');
        hasError = true;
    }

    if (hasError) return;

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/auth/token`, {
        method: "POST",
        body: formData
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        showTodoSection();
    } else {
        const data = await response.json();
        // Show error under password field for 401
        if (response.status === 401) {
            showError('password', 'Incorrect username or password');
        } else {
            showError('password', data.detail || "Login failed");
        }
    }
}

/**
 * Load Statistics
 */
async function loadStatistics() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/tasks/stats`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401) return logout();

        const stats = await response.json();

        document.getElementById("statTotal").textContent = stats.total;
        document.getElementById("statCompleted").textContent = stats.completed;
        document.getElementById("statPending").textContent = stats.pending;
        document.getElementById("statUrgent").textContent = stats.by_priority.urgent;
    } catch (error) {
        console.error("Error loading statistics:", error);
    }
}

/**
 * Load User Profile for Navigation
 */
async function loadUserProfile() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();

            // Update Name
            const nameEl = document.getElementById("navProfileName");
            if (nameEl) nameEl.textContent = user.full_name || user.username;

            // Update Avatar
            const avatarEl = document.getElementById("navProfileAvatar");
            if (avatarEl) {
                if (user.profile_image) {
                    avatarEl.src = user.profile_image;
                    // Add cache buster if needed, or rely on distinct URLs
                } else {
                    avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=random`;
                }
                avatarEl.style.display = "block";
            }
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

/**
 * Load All Tasks
 */
async function loadTasks() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/tasks/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401) return logout();

        allTasks = await response.json();
        renderTasks(allTasks);
        loadStatistics();
    } catch (error) {
        console.error("Error loading tasks:", error);
    }
}

/**
 * Create New Task
 */
async function createTask() {
    const title = document.getElementById("taskInput").value.trim();
    const priority = document.getElementById("taskPriority").value;
    const category = document.getElementById("taskCategory").value.trim();
    const dueDate = document.getElementById("taskDueDate").value;
    const token = localStorage.getItem("token");

    if (!title) return alert("Please enter a task title!");

    const taskData = {
        title: title,
        priority: priority
    };

    if (category) taskData.category = category;
    if (dueDate) taskData.due_date = dueDate;

    try {
        const response = await fetch(`${API_URL}/tasks/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            // Clear form
            document.getElementById("taskInput").value = "";
            document.getElementById("taskPriority").value = "medium";
            document.getElementById("taskCategory").value = "";
            document.getElementById("taskDueDate").value = "";

            loadTasks();
        } else {
            const err = await response.json();
            alert("Error: " + (err.detail || "Could not add task"));
        }
    } catch (error) {
        console.error("Create Task Error:", error);
    }
}

/**
 * Toggle Task Completion Status
 */
async function toggleTaskStatus(id, currentStatus) {
    const token = localStorage.getItem("token");
    try {
        await fetch(`${API_URL}/tasks/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ is_completed: !currentStatus })
        });
        loadTasks();
    } catch (err) {
        console.error("Toggle Error:", err);
    }
}

/**
 * Edit Task
 */
async function editTask(id, task) {
    const newTitle = prompt("Update task title:", task.title);
    if (!newTitle || newTitle === task.title) return;

    const token = localStorage.getItem("token");
    try {
        await fetch(`${API_URL}/tasks/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title: newTitle })
        });
        loadTasks();
    } catch (err) {
        console.error("Edit Error:", err);
    }
}

/**
 * Delete Task
 */
async function deleteTask(id) {
    const token = localStorage.getItem("token");
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) loadTasks();
    } catch (error) {
        console.error("Delete Error:", error);
    }
}

/**
 * Filter Tasks
 */
function filterTasks(filter) {
    currentFilter = filter;

    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    let filteredTasks = allTasks;

    switch (filter) {
        case 'pending':
            filteredTasks = allTasks.filter(task => !task.is_completed);
            break;
        case 'completed':
            filteredTasks = allTasks.filter(task => task.is_completed);
            break;
        case 'urgent':
            filteredTasks = allTasks.filter(task => task.priority === 'urgent');
            break;
        case 'high':
            filteredTasks = allTasks.filter(task => task.priority === 'high');
            break;
    }

    renderTasks(filteredTasks);
}

/**
 * Format Date
 */
function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `❗ Overdue`;
    if (diffDays === 0) return `📅 Today`;
    if (diffDays === 1) return `📅 Tomorrow`;
    if (diffDays <= 7) return `📅 ${diffDays} days`;

    return `📅 ${date.toLocaleDateString()}`;
}

/**
 * Render Tasks (XSS-safe)
 */
function renderTasks(tasks) {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    if (tasks.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "empty-state";
        emptyDiv.innerHTML = `
            <div class="empty-state-icon">📭</div>
            <p>No tasks found. Create one to get started!</p>
        `;
        taskList.appendChild(emptyDiv);
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement("li");
        li.className = `task-item priority-${task.priority} ${task.is_completed ? 'completed' : ''}`;

        // Create task main container
        const taskMain = document.createElement("div");
        taskMain.className = "task-main";

        // Create task header
        const taskHeader = document.createElement("div");
        taskHeader.className = "task-header";

        // Task title (XSS-safe using textContent)
        const titleSpan = document.createElement("span");
        titleSpan.className = "task-title";
        titleSpan.textContent = task.title;  // Safe: textContent escapes HTML
        taskHeader.appendChild(titleSpan);

        // Priority badge
        const priorityBadge = document.createElement("span");
        priorityBadge.className = `task-badge badge-${task.priority}`;
        priorityBadge.textContent = task.priority;
        taskHeader.appendChild(priorityBadge);

        // Category badge (if exists)
        if (task.category) {
            const categoryBadge = document.createElement("span");
            categoryBadge.className = "task-badge badge-category";
            categoryBadge.textContent = `📁 ${task.category}`;
            taskHeader.appendChild(categoryBadge);
        }

        taskMain.appendChild(taskHeader);

        // Task meta information
        const taskMeta = document.createElement("div");
        taskMeta.className = "task-meta";

        if (task.due_date) {
            const dueSpan = document.createElement("span");
            dueSpan.className = "task-meta-item";
            dueSpan.textContent = formatDate(task.due_date);
            taskMeta.appendChild(dueSpan);
        }

        const createdSpan = document.createElement("span");
        createdSpan.className = "task-meta-item";
        createdSpan.textContent = `🕒 Created ${new Date(task.created_at).toLocaleDateString()}`;
        taskMeta.appendChild(createdSpan);

        taskMain.appendChild(taskMeta);
        li.appendChild(taskMain);

        // Task actions
        const taskActions = document.createElement("div");
        taskActions.className = "task-actions";

        // Complete/Undo button
        const completeBtn = document.createElement("button");
        completeBtn.className = `btn btn-sm ${task.is_completed ? 'btn-secondary' : 'btn-success'}`;
        completeBtn.textContent = task.is_completed ? "↩️ Undo" : "✓ Done";
        completeBtn.onclick = () => toggleTaskStatus(task.id, task.is_completed);
        taskActions.appendChild(completeBtn);

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-sm btn-edit";
        editBtn.textContent = "✏️ Edit";
        editBtn.onclick = () => editTask(task.id, task);
        taskActions.appendChild(editBtn);

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-sm btn-danger";
        deleteBtn.textContent = "🗑️ Delete";
        deleteBtn.onclick = () => deleteTask(task.id);
        taskActions.appendChild(deleteBtn);

        li.appendChild(taskActions);
        taskList.appendChild(li);
    });
}

/**
 * Show Todo Section
 */
async function showTodoSection() {
    document.getElementById("authContainer").style.display = "none";
    document.getElementById("profileContainer").style.display = "none";
    document.getElementById("todoContainer").style.display = "block";
    loadTasks();
    loadUserProfile();
}

/**
 * Show Profile Section (SPA)
 */
async function showProfileSection() {
    document.getElementById("todoContainer").style.display = "none";
    document.getElementById("authContainer").style.display = "none"; // Safety
    document.getElementById("profileContainer").style.display = "block";
    await fetchProfile();
}

/**
 * Profile: Fetch Data
 */
async function fetchProfile() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            renderProfileDisplay(user);
            populateProfileForm(user);
        } else if (response.status === 401) {
            logout();
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

/**
 * Profile: Render Display Card
 */
function renderProfileDisplay(user) {
    // Basic Info
    const displayAvatar = document.getElementById('profileDisplayAvatar'); // Distinguished ID
    const displayName = document.getElementById('displayName');
    const displayTitle = document.getElementById('displayTitle');

    if (displayName) displayName.textContent = user.full_name || user.username;
    if (displayTitle) displayTitle.textContent = user.job_title || 'No title set';

    // Email
    const emailSpan = document.getElementById('emailDisplay')?.querySelector('span');
    if (emailSpan) emailSpan.textContent = user.email;

    // Avatar
    if (displayAvatar) {
        if (user.profile_image) {
            displayAvatar.src = user.profile_image;
        } else {
            displayAvatar.src = `https://ui-avatars.com/api/?name=${user.username}&background=random`;
        }
    }

    // Website
    const websiteEl = document.getElementById('websiteDisplay');
    if (websiteEl) {
        if (user.website) {
            websiteEl.classList.remove('hidden');
            websiteEl.classList.add('flex');
            websiteEl.querySelector('a').href = user.website;
            websiteEl.querySelector('a').textContent = user.website.replace(/^https?:\/\//, '');
        } else {
            websiteEl.classList.add('hidden');
            websiteEl.classList.remove('flex');
        }
    }

    // Bio
    const bioSection = document.getElementById('bioSection');
    const bioDisplay = document.getElementById('displayBio');
    if (bioSection && bioDisplay) {
        if (user.bio) {
            bioSection.classList.remove('hidden');
            bioDisplay.textContent = user.bio;
        } else {
            bioSection.classList.add('hidden');
        }
    }
}

/**
 * Profile: Populate Form
 */
function populateProfileForm(user) {
    document.getElementById('fullNameInput').value = user.full_name || '';
    document.getElementById('jobTitleInput').value = user.job_title || '';
    document.getElementById('bioInput').value = user.bio || '';
    document.getElementById('websiteInput').value = user.website ? user.website.replace(/^https?:\/\//, '') : '';
}

/**
 * Profile: Update
 */
async function updateProfile(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');

    let website = document.getElementById('websiteInput').value;
    if (website && !website.startsWith('http')) {
        website = 'https://' + website;
    }

    const data = {
        full_name: document.getElementById('fullNameInput').value,
        job_title: document.getElementById('jobTitleInput').value,
        bio: document.getElementById('bioInput').value,
        website: website
    };

    try {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const updatedUser = await response.json();
            renderProfileDisplay(updatedUser);

            // Also update the nav bar logic since user might have changed name/avatar
            loadUserProfile();

            // Button feedback
            const btn = event.target.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '✓ Saved!';
            btn.style.backgroundColor = 'green'; // Simple inline feedback
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.backgroundColor = 'skyblue'; // Revert to skyblue
            }, 2000);
        } else {
            alert('Failed to update profile.');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
    }
}

/**
 * Profile: Upload Avatar
 */
async function uploadAvatar(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/users/me/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            const updatedUser = await response.json();
            renderProfileDisplay(updatedUser);
            // Refresh nav bar avatar too
            loadUserProfile();
        } else {
            alert('Failed to upload image.');
        }
    } catch (error) {
        console.error('Error uploading avatar:', error);
    }
}


/**
 * Logout
 */
function logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
}
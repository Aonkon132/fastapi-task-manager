const API_URL = "/tasks"; // Base API URL for task operations

// Wait for the DOM to be fully loaded before fetching tasks
document.addEventListener("DOMContentLoaded", loadTasks);

/**
 * 1. Fetch and display all tasks from the database (READ)
 * Dynamically renders task list with serial numbers, titles, and status badges.
 */
async function loadTasks() {
    try {
        // Fetch tasks from the backend GET /tasks/ endpoint
        const response = await fetch(`${API_URL}/`);
        const tasks = await response.json();
        
        const taskList = document.getElementById("taskList");
        if (!taskList) return;

        taskList.innerHTML = ""; // Clear existing UI list before re-rendering

        // Display a message if no tasks are found in the database
        if (tasks.length === 0) {
            taskList.innerHTML = "<li style='color: gray; border: none;'>No tasks found!</li>";
            return;
        }

        // Loop through the tasks array and generate HTML for each task
        tasks.forEach((task, index) => {
            const li = document.createElement("li");
            
            // Set status badge and text styling based on task.is_completed status
            const statusBadge = task.is_completed 
                ? '<span class="status-done">✅ Done</span>' 
                : '<span class="status-pending">⏳ Pending</span>';
            
            const titleClass = task.is_completed ? 'completed' : '';

            li.innerHTML = `
                <div class="task-info" style="display: flex; align-items: center;">
                    <span class="task-number">#${index + 1}</span>
                    
                    <span class="${titleClass}">${task.title}</span> 
                    
                    ${statusBadge}
                </div>
                <div class="task-actions">
                    <button class="status-btn" onclick="toggleTask(${task.id}, ${task.is_completed})">
                        ${task.is_completed ? "Undo" : "Done"}
                    </button>
                    <button class="edit-btn" onclick="updateTask(${task.id}, '${task.title}')">Edit</button>
                    <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    } catch (error) {
        console.error("Error loading tasks:", error);
    }
}

/**
 * 2. Add a new task to the database (CREATE)
 */
async function createTask() {
    const input = document.getElementById("taskInput");
    const title = input.value.trim();

    // Prevent submission if the input field is empty
    if (!title) {
        alert("Please write something!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: title }) 
        });

        if (response.ok) {
            input.value = ""; // Reset input field on success
            await loadTasks(); // Refresh list to show new task
        } else {
            const err = await response.json();
            // Display specific validation error message from the backend
            alert("Error: " + (err.detail || "Validation failed"));
        }
    } catch (error) {
        console.error("Network error:", error);
    }
}

/**
 * 3. Toggle task completion status (UPDATE - PATCH)
 * Switches is_completed between true and false
 */
async function toggleTask(id, currentStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_completed: !currentStatus }) 
        });
        
        if (response.ok) {
            await loadTasks(); // Refresh list to update UI
        }
    } catch (error) {
        console.error("Failed to toggle task status:", error);
    }
}

/**
 * 4. Modify an existing task title (UPDATE - PATCH)
 */
async function updateTask(id, oldTitle) {
    const newTitle = prompt("Update your task:", oldTitle);
    
    // Proceed only if the title is valid and actually changed
    if (newTitle && newTitle.trim() !== "" && newTitle !== oldTitle) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle.trim() }) 
            });
            
            if (response.ok) {
                await loadTasks(); // Refresh list
            } else {
                const err = await response.json();
                alert("Error: " + (err.detail || "Update failed"));
            }
        } catch (error) {
            console.error("Update failed:", error);
        }
    }
}

/**
 * 5. Remove a task from the database (DELETE)
 */
async function deleteTask(id) {
    if (confirm("Are you sure you want to delete this task?")) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });
            if (response.ok) {
                await loadTasks(); // Refresh list
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    }
}
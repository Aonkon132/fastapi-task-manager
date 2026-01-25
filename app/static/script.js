const API_URL = "/tasks"; // Base API URL for task operations

// Wait for the DOM to be fully loaded before fetching tasks
document.addEventListener("DOMContentLoaded", loadTasks);

// 1. Fetch and display all tasks from the database (READ)
async function loadTasks() {
    try {
        // Calling GET /tasks/ endpoint
        const response = await fetch(`${API_URL}/`);
        const tasks = await response.json();
        
        const taskList = document.getElementById("taskList");
        if (!taskList) return;

        taskList.innerHTML = ""; // Clear the list before rendering updated data

        if (tasks.length === 0) {
            taskList.innerHTML = "<li style='color: gray; border: none;'>No tasks found!</li>";
        }

        tasks.forEach(task => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="${task.is_completed ? 'completed' : ''}">${task.title}</span> 
                <div>
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

// 2. Add a new task to the database (CREATE)
async function createTask() {
    const input = document.getElementById("taskInput");
    const title = input.value.trim();

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
            input.value = ""; // Clear input field after successful creation
            await loadTasks(); // Reload the list to show the newly added task
        } else {
            const err = await response.json();
            alert("Error: " + JSON.stringify(err.detail));
        }
    } catch (error) {
        console.error("Network error:", error);
    }
}

// 3. Remove a task from the database (DELETE)
async function deleteTask(id) {
    if (confirm("Are you sure you want to delete this?")) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });
            if (response.ok) {
                await loadTasks(); // Refresh list after deletion
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    }
}

// 4. Modify an existing task title (UPDATE - PATCH)
async function updateTask(id, oldTitle) {
    const newTitle = prompt("Update your task:", oldTitle);
    
    if (newTitle && newTitle.trim() !== "" && newTitle !== oldTitle) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle.trim() }) 
            });
            if (response.ok) {
                await loadTasks(); // Refresh list to show updated title
            }
        } catch (error) {
            console.error("Update failed:", error);
        }
    }
}
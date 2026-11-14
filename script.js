// Backend API URL
const API_URL = "http://localhost:5000/api/tasks";

let tasks = [];
let currentFilter = "all";

const taskInput = document.getElementById("taskInput");
const addButton = document.getElementById("addButton");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");

// GET: load tasks from backend
async function loadTasks() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Could not load tasks");
        tasks = await response.json();
        displayTasks();
        updateCounts();
    } catch (error) {
        console.error("Loading error:", error);
        alert("Unable to load tasks. Please check the backend.");
    }
}

// POST: add a new task
async function addTask() {
    let title = taskInput.value.trim().replace(/\s+/g, " ");

    if (title === "") {
        alert("Please enter a task!");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: title })
        });
        if (!response.ok) throw new Error("Could not add task");

        const newTask = await response.json();
        tasks.push(newTask);
        taskInput.value = "";
        displayTasks();
        updateCounts();
    } catch (error) {
        console.error("Add error:", error);
        alert("Unable to add task. Please try again.");
    }
}

// PUT: complete or undo a task
async function completeTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) {
        alert("Task not found!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: !task.completed })
        });
        if (!response.ok) throw new Error("Could not update task");

        const updatedTask = await response.json();
        tasks = tasks.map(t => (t.id === id ? updatedTask : t));
        displayTasks();
        updateCounts();
    } catch (error) {
        console.error("Update error:", error);
        alert("Unable to update task.");
    }
}

// DELETE: delete a task
async function deleteTask(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Could not delete task");

        tasks = tasks.filter(task => task.id !== id);
        displayTasks();
        updateCounts();
    } catch (error) {
        console.error("Delete error:", error);
        alert("Unable to delete task.");
    }
}

function getPendingTasks() {
    return tasks.filter(task => task.completed === false);
}

function getCompletedTasks() {
    return tasks.filter(task => task.completed === true);
}

function updateCounts() {
    document.getElementById("totalCount").textContent = tasks.length;
    document.getElementById("completedCount").textContent = getCompletedTasks().length;
    document.getElementById("pendingCount").textContent = getPendingTasks().length;
}

function displayTasks() {
    let filteredTasks;

    if (currentFilter === "pending") {
        filteredTasks = getPendingTasks();
    } else if (currentFilter === "completed") {
        filteredTasks = getCompletedTasks();
    } else {
        filteredTasks = tasks;
    }

    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-item">
            <span class="task-title ${task.completed ? "completed" : ""}">
                ${escapeHTML(task.title)}
            </span>
            <div class="task-actions">
                <button class="complete-btn" data-action="complete" data-id="${task.id}">
                    ${task.completed ? "Undo" : "Complete"}
                </button>
                <button class="delete-btn" data-action="delete" data-id="${task.id}">
                    Delete
                </button>
            </div>
        </div>
    `).join("");

    emptyMessage.style.display = filteredTasks.length === 0 ? "block" : "none";
}

function escapeHTML(value) {
    return value.replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

addButton.addEventListener("click", addTask);

taskInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") addTask();
});

taskList.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === "complete") completeTask(id);
    if (button.dataset.action === "delete") deleteTask(id);
});

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = this.dataset.filter;
        document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");
        displayTasks();
    });
});

// Load tasks when the page opens
loadTasks();
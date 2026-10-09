const STORAGE_KEY = "iReadyStudyCompanion";

const defaultState = {
  tasks: [],
  notes: "",
  timer: {
    isRunning: false,
    durationSeconds: 25 * 60,
    remainingSeconds: 25 * 60
  }
};

let state = loadState();

const taskForm = document.getElementById("taskForm");
const taskNameInput = document.getElementById("taskName");
const taskDateInput = document.getElementById("taskDate");
const taskPriorityInput = document.getElementById("taskPriority");
const taskList = document.getElementById("taskList");
const notesInput = document.getElementById("notes");
const doneCount = document.getElementById("doneCount");
const todoCount = document.getElementById("todoCount");
const timeDisplay = document.getElementById("timeDisplay");
const startPauseBtn = document.getElementById("startPauseBtn");
const resetBtn = document.getElementById("resetBtn");

let timerInterval = null;

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(saved);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      timer: {
        isRunning: false,
        durationSeconds: parsed?.timer?.durationSeconds || 25 * 60,
        remainingSeconds: parsed?.timer?.remainingSeconds || 25 * 60
      }
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateStats() {
  const done = state.tasks.filter(task => task.completed).length;
  const todo = state.tasks.length - done;

  doneCount.textContent = done;
  todoCount.textContent = todo;
}

function renderTasks() {
  taskList.innerHTML = "";

  if (state.tasks.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "task-item";
    emptyItem.innerHTML = `
      <div class="task-main">
        <span class="task-text">
          <span class="task-name">No tasks yet</span>
        </span>
      </div>
    `;
    taskList.appendChild(emptyItem);
    return;
  }

  state.tasks.forEach(task => {
    const item = document.createElement("li");
    item.className = "task-item";

    const taskDateText = task.date ? new Date(task.date + "T00:00:00").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    }) : "No date";

    item.innerHTML = `
      <div class="task-main">
        <input type="checkbox" ${task.completed ? "checked" : ""} data-id="${task.id}" />
        <span class="task-text">
          <span class="task-name">${escapeHtml(task.name)}</span>
          <span class="task-meta">${taskDateText}</span>
          <span class="task-priority priority-${task.priority}">${task.priority}</span>
        </span>
      </div>
      <button class="task-delete" data-id="${task.id}">Delete</button>
    `;

    taskList.appendChild(item);
  });

  taskList.querySelectorAll('input[type="checkbox"]').forEach(box => {
    box.addEventListener("change", event => {
      const taskId = Number(event.target.dataset.id);
      const task = state.tasks.find(item => item.id === taskId);
      if (!task) return;

      task.completed = event.target.checked;
      saveState();
      updateStats();
      renderTasks();
    });
  });

  taskList.querySelectorAll(".task-delete").forEach(button => {
    button.addEventListener("click", () => {
      const taskId = Number(button.dataset.id);
      state.tasks = state.tasks.filter(task => task.id !== taskId);
      saveState();
      updateStats();
      renderTasks();
    });
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function addTask(event) {
  event.preventDefault();

  const name = taskNameInput.value.trim();
  if (!name) return;

  const newTask = {
    id: Date.now(),
    name,
    date: taskDateInput.value,
    priority: taskPriorityInput.value,
    completed: false
  };

  state.tasks.unshift(newTask);
  taskForm.reset();
  taskPriorityInput.value = "medium";
  saveState();
  updateStats();
  renderTasks();
}

function renderTimer() {
  timeDisplay.textContent = formatTime(state.timer.remainingSeconds);
  startPauseBtn.textContent = state.timer.isRunning ? "Pause" : "Start";
}

function startTimer() {
  if (state.timer.isRunning) {
    state.timer.isRunning = false;
    clearInterval(timerInterval);
    renderTimer();
    saveState();
    return;
  }

  state.timer.isRunning = true;
  timerInterval = setInterval(() => {
    if (state.timer.remainingSeconds > 0) {
      state.timer.remainingSeconds -= 1;
      renderTimer();
      saveState();
    } else {
      clearInterval(timerInterval);
      state.timer.isRunning = false;
      renderTimer();
      saveState();
    }
  }, 1000);

  renderTimer();
  saveState();
}

function resetTimer() {
  clearInterval(timerInterval);
  state.timer.isRunning = false;
  state.timer.remainingSeconds = state.timer.durationSeconds;
  renderTimer();
  saveState();
}

function setupNotes() {
  notesInput.value = state.notes;
  notesInput.addEventListener("input", event => {
    state.notes = event.target.value;
    saveState();
  });
}

taskForm.addEventListener("submit", addTask);
startPauseBtn.addEventListener("click", startTimer);
resetBtn.addEventListener("click", resetTimer);

setupNotes();
updateStats();
renderTasks();
renderTimer();

const STORAGE_KEY = "lumen_habits_god_tier";

const addBtn = document.getElementById("addHabit");
const habitList = document.getElementById("habitList");
const totalStreakEl = document.getElementById("totalStreak");
const bestStreakEl = document.getElementById("bestStreak");
const totalDoneEl = document.getElementById("totalDone");
const habitForm = document.getElementById("habitForm");
const habitModal = document.getElementById("habitModal");
const categorySelect = document.getElementById("categorySelect");
const customCategoryInputs = document.getElementById("customCategoryInputs");

const CATEGORIES = [
  { name: "Santé", color: "#6BCB77", icon: "💪" },
  { name: "Productivité", color: "#4D96FF", icon: "📝" },
  { name: "Perso", color: "#FF6B6B", icon: "🧘" },
  { name: "Loisirs", color: "#FFD93D", icon: "🎵" },
];

// ====================== HELPERS ======================
function today() {
  return new Date().toISOString().slice(0, 10);
}

function weekStart() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function weekDays() {
  return ["L", "M", "M", "J", "V", "S", "D"];
}

function load() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ====================== HABIT OBJECT ======================
function newHabit(name, categoryName, weeklyGoal, color, icon) {
  return {
    id: crypto.randomUUID(),
    name,
    category: categoryName,
    color,
    icon,
    weeklyGoal,
    logs: {},
    streak: 0,
    best: 0,
  };
}

// ====================== MODAL HANDLING ======================
categorySelect.addEventListener("change", () => {
  customCategoryInputs.classList.toggle(
    "hidden",
    categorySelect.value !== "Autre",
  );
});

document.getElementById("closeModal").addEventListener("click", () => {
  habitModal.classList.add("hidden");
  habitForm.reset();
});

// ====================== STATS ======================
function computeStreak(h) {
  const dates = Object.keys(h.logs).sort().reverse();
  let streak = 0;
  for (const d of dates) {
    if (h.logs[d]) streak++;
    else break;
  }
  h.streak = streak;
  h.best = Math.max(h.best, streak);
}

function progress(h) {
  const start = weekStart();
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    if (h.logs[key]) done++;
  }
  return Math.round((done / h.weeklyGoal) * 100);
}

function renderStatsGlobal(data) {
  const totalStreak = data.reduce((a, h) => a + h.streak, 0);
  const bestStreak = data.length ? Math.max(...data.map((h) => h.best)) : 0;
  const totalDone = data.length
    ? Math.round(data.reduce((a, h) => a + progress(h), 0) / data.length)
    : 0;

  totalStreakEl.textContent = totalStreak;
  bestStreakEl.textContent = bestStreak;
  totalDoneEl.textContent = totalDone + "%";
}

// ====================== RENDER ======================
function renderCalendar(h) {
  const start = weekStart();
  const days = weekDays();
  let html = "";
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    html += `<span class="${h.logs[key] ? "on" : ""}" title="${key}">${days[i]}</span>`;
  }
  return html;
}

function updateHabitCard(li, h) {
  li.querySelector("input[type='checkbox']").checked = !!h.logs[today()];
  li.querySelector(".habit-stats").textContent =
    `🔥 ${h.streak} | 🏆 ${h.best} | 📈 ${progress(h)}%`;
  li.querySelector(".habit-calendar").innerHTML = renderCalendar(h);
}

function createConfetti() {
  for (let i = 0; i < 30; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * window.innerWidth + "px";
    c.style.background = `hsl(${Math.random() * 360},80%,60%)`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2000);
  }
}

function render() {
  const data = load();
  habitList.innerHTML = "";
  renderStatsGlobal(data);

  data.forEach((h, index) => {
    const li = document.createElement("li");
    li.className = "habit-card";
    li.style.borderLeft = `6px solid ${h.color}`;
    li.draggable = true;

    const doneToday = !!h.logs[today()];

    li.innerHTML = `
      <div class="habit-title">
        <span class="habit-icon">${h.icon}</span>
        <span>${h.name} (${h.weeklyGoal}/semaine)</span>
        <span class="habit-category" style="background:${h.color}">${h.category}</span>
        <input type="checkbox" ${doneToday ? "checked" : ""}>
        <button class="delete-habit">🗑️</button>
      </div>
      <div class="habit-stats">🔥 ${h.streak} | 🏆 ${h.best} | 📈 ${progress(h)}%</div>
      <div class="habit-calendar">${renderCalendar(h)}</div>
    `;

    // Checkbox
    li.querySelector("input[type='checkbox']").addEventListener(
      "change",
      (e) => {
        h.logs[today()] = e.target.checked;
        computeStreak(h);
        save(data);
        updateHabitCard(li, h);
        if (e.target.checked) createConfetti();
      },
    );

    // Delete
    li.querySelector(".delete-habit").addEventListener("click", () => {
      if (confirm("Supprimer cette habitude ?")) {
        const newData = data.filter((habit) => habit.id !== h.id);
        save(newData);
        render();
      }
    });

    // Drag & Drop
    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", index);
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
    li.addEventListener("dragover", (e) => e.preventDefault());
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
      const moved = data.splice(fromIndex, 1)[0];
      data.splice(index, 0, moved);
      save(data);
      render();
    });

    habitList.appendChild(li);
  });
}

// ====================== FORM SUBMIT ======================
habitForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(habitForm);
  const name = formData.get("name");
  let category = formData.get("category");
  let color, icon;

  if (category === "Autre") {
    category = formData.get("customCategoryName") || "Autre";
    color = formData.get("customCategoryColor") || "#845EC2";
    icon = formData.get("customCategoryIcon") || "❓";
  } else {
    const cat = CATEGORIES.find((c) => c.name === category);
    color = cat.color;
    icon = cat.icon;
  }

  const habitIcon = formData.get("habitIcon") || icon;
  const weeklyGoal = parseInt(formData.get("weeklyGoal"), 10) || 3;

  const data = load();
  data.push(newHabit(name, category, weeklyGoal, color, habitIcon));
  save(data);
  habitModal.classList.add("hidden");
  habitForm.reset();
  render();
});

// ====================== INITIAL RENDER ======================
render();

// ====================== STORAGE SYNC ======================
window.addEventListener("storage", render);

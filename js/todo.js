/* ========================= ELEMENTS ========================= */
const listsEl = document.getElementById("lists");
const todoListEl = document.getElementById("todoList");
const listTitleEl = document.getElementById("listTitle");
const iconPickerEl = document.getElementById("iconPicker");
const colorPickerEl = document.getElementById("colorPicker");
const toggleDoneBtn = document.getElementById("toggleDone");

const formEl = document.getElementById("todoForm");
const inputEl = document.getElementById("todoInput");

const addListBtn = document.getElementById("addList");
const deleteListBtn = document.getElementById("deleteList");
const duplicateListBtn = document.getElementById("duplicateList");

/* ========================= ETAT ========================= */
let showDone = true;
let draggedTodo = null;
let draggedList = null;

/* ========================= LISTES PAR DÉFAUT ========================= */
const defaultLists = [
  {
    id: 1,
    name: "Ma journée",
    icon: "📅",
    color: "#6f3fc7",
    todos: [],
    isDefault: true,
    placeholder: "Concentrez-vous sur votre journée. Effectuez vos tâches ici.",
  },
  {
    id: 2,
    name: "Important",
    icon: "⭐",
    color: "#facc15",
    todos: [],
    isDefault: true,
  },
];

/* ========================= CHARGEMENT DES LISTES ========================= */
let storedLists = JSON.parse(localStorage.getItem("todoLists")) || [];

// Ajouter les listes par défaut si elles n'existent pas
defaultLists.forEach((defaultList) => {
  if (!storedLists.find((l) => l.name === defaultList.name))
    storedLists.push(defaultList);
});

let lists = storedLists;
let currentListId = lists[0].id;

/* ========================= SAUVEGARDE ========================= */
function save() {
  localStorage.setItem("todoLists", JSON.stringify(lists));
}

/* ========================= RENDER LISTES ========================= */
function renderLists() {
  listsEl.innerHTML = "";

  // 1️⃣ Listes fixes
  defaultLists.forEach((list) => {
    const li = createListElement(list, false); // non-draggable
    listsEl.appendChild(li);
  });

  // Divider
  const divider = document.createElement("hr");
  divider.style.margin = "10px 0";
  divider.style.border = "0.5px solid #444";
  listsEl.appendChild(divider);

  // 2️⃣ Listes créées par l'utilisateur
  const customLists = lists.filter((l) => !l.isDefault);
  customLists.forEach((list) => {
    const li = createListElement(list, true); // draggable

    // Drag & drop pour réordonner les listes
    li.draggable = true;
    li.ondragstart = () => {
      draggedList = list;
      li.classList.add("dragging");
    };
    li.ondragend = () => {
      draggedList = null;
      document
        .querySelectorAll("#lists li")
        .forEach((el) => el.classList.remove("drag-over"));
    };
    li.ondragover = (e) => e.preventDefault();
    li.ondrop = () => {
      if (!draggedList || draggedList.id === list.id) return;
      const fromIndex = lists.findIndex((l) => l.id === draggedList.id);
      const toIndex = lists.findIndex((l) => l.id === list.id);
      lists.splice(fromIndex, 1);
      lists.splice(toIndex, 0, draggedList);
      draggedList = null;
      renderLists();
      save();
    };

    listsEl.appendChild(li);
  });
}

// Création d’un <li> pour une liste
function createListElement(list, draggable) {
  const li = document.createElement("li");
  li.innerHTML = `<span>${list.icon}</span> ${list.name}`;
  li.style.borderLeft = `6px solid ${list.color}`;

  li.querySelector("span").style.color = list.color;

  if (list.id === currentListId) li.classList.add("active");

  li.onclick = () => {
    currentListId = list.id;
    animateContent();
    renderTodos();
  };

  return li;
}

/* ========================= RENDER TODOS ========================= */
function renderTodos() {
  const list = lists.find((l) => l.id === currentListId);
  if (!list) return;

  listTitleEl.textContent = list.name;

  // 🔹 Masquer pickers pour listes fixes
  if (list.isDefault) {
    iconPickerEl.classList.add("hidden");
    colorPickerEl.classList.add("hidden");
    listTitleEl.contentEditable = false;
  } else {
    iconPickerEl.classList.remove("hidden");
    colorPickerEl.classList.remove("hidden");
    listTitleEl.contentEditable = true;
  }

  iconPickerEl.value = list.icon;
  colorPickerEl.value = list.color;

  todoListEl.innerHTML = "";

  // Empty state
  if (list.todos.length === 0) {
    let emptyHTML = "";
    if (list.placeholder) {
      emptyHTML = `
      <li class="empty-state">
        <div class="empty-box">
          <img src="/assets/icons/calendar.png" alt="Calendrier" class="empty-icon" />
          <p class="empty-main">Concentrez-vous sur votre journée.</p>
          <p class="empty-sub">${list.placeholder.split(". ").slice(1).join(". ")}</p>
        </div>
      </li>
      `;
    } else {
      emptyHTML = `
      <li class="empty-state">
        <div class="empty-box">
          <img src="/assets/icons/leaf.png" alt="Vide" class="empty-icon" />
          <p class="empty-main">Rien à faire pour l'instant.</p>
          <p class="empty-sub">Profitez de ce moment</p>
        </div>
      </li>
      `;
    }
    todoListEl.innerHTML = emptyHTML;
  }

  const visibleTodos = list.todos.filter((t) => showDone || !t.done);
  visibleTodos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.draggable = true;
    if (todo.done) li.classList.add("done");

    const checkboxId = `todo-${list.id}-${index}`; // ID unique

    li.innerHTML = `
    <div class="todo-left">
      <input type="checkbox" id="${checkboxId}" ${todo.done ? "checked" : ""} />
      <label for="${checkboxId}"></label>
      <span class="todo-text" contenteditable="true">${todo.text}</span>
    </div>
    <button class="important"><img src="/assets/icons/${todo.important ? "star_check.png" : "star.png"}" /></button>
    <button class="delete">✕</button>
  `;

    // Checkbox
    li.querySelector("input").onchange = (e) => {
      todo.done = e.target.checked;
      updateImportantList(todo);
      renderTodos();
      save();
    };

    // Supprimer tâche
    li.querySelector(".delete").onclick = () => {
      li.style.animation = "shrink 0.2s forwards";
      setTimeout(() => {
        list.todos.splice(index, 1);
        updateImportantList(todo, true);
        renderTodos();
        save();
      }, 200);
    };

    // Toggle important
    li.querySelector(".important").onclick = () => {
      todo.important = !todo.important;
      updateImportantList(todo);
      renderTodos();
      save();
    };

    // Drag & drop
    li.ondragstart = () => {
      draggedTodo = { fromListId: currentListId, index };
      li.classList.add("dragging");
    };
    li.ondragend = () => {
      draggedTodo = null;
      document
        .querySelectorAll(".todo-item")
        .forEach((el) => el.classList.remove("dragging", "drag-over"));
    };
    li.ondragover = (e) => {
      e.preventDefault();
      if (!draggedTodo || draggedTodo.index === index) return;
      li.classList.add("drag-over");
    };
    li.ondragleave = () => li.classList.remove("drag-over");
    li.ondrop = (e) => {
      e.preventDefault();
      if (!draggedTodo) return;

      const fromList = lists.find((l) => l.id === draggedTodo.fromListId);
      const toList = lists.find((l) => l.id === currentListId);
      const moved = fromList.todos.splice(draggedTodo.index, 1)[0];
      toList.todos.splice(index, 0, moved);

      draggedTodo = null;
      document
        .querySelectorAll(".todo-item")
        .forEach((el) => el.classList.remove("dragging", "drag-over"));

      renderTodos();
      save();
    };

    todoListEl.appendChild(li);
  });
}

/* ========================= GESTION LISTE IMPORTANT ========================= */
function updateImportantList(todo, remove = false) {
  const importantList = lists.find((l) => l.name === "Important");
  if (!importantList) return;

  const exists = importantList.todos.find(
    (t) => t.text === todo.text && t.fromListId === currentListId,
  );

  if (remove || !todo.important) {
    if (exists)
      importantList.todos = importantList.todos.filter((t) => t !== exists);
  } else {
    if (!exists)
      importantList.todos.push({ ...todo, fromListId: currentListId });
  }
}

/* ========================= FORMULAIRE ========================= */
formEl.onsubmit = (e) => {
  e.preventDefault();
  const value = inputEl.value.trim();
  if (!value) return;

  const list = lists.find((l) => l.id === currentListId);
  list.todos.push({ text: value, done: false, important: false });

  inputEl.value = "";
  renderTodos();
  save();
};

/* ========================= ACTION LISTES ========================= */
addListBtn.onclick = () => {
  const newList = {
    id: Date.now(),
    name: "Nouvelle liste",
    icon: "📝",
    color: "#6f3fc7",
    todos: [],
    isDefault: false,
  };
  lists.push(newList);
  currentListId = newList.id;
  animateContent();
  renderLists();
  renderTodos();
  save();
};

deleteListBtn.onclick = () => {
  const list = lists.find((l) => l.id === currentListId);
  if (!list || list.isDefault) return;
  lists = lists.filter((l) => l.id !== currentListId);
  currentListId = lists[0].id;
  animateContent();
  renderLists();
  renderTodos();
  save();
};

duplicateListBtn.onclick = () => {
  const list = lists.find((l) => l.id === currentListId);
  if (!list) return;
  const copy = structuredClone(list);
  copy.id = Date.now();
  copy.name = list.name + " (copie)";
  copy.isDefault = false;
  lists.push(copy);
  renderLists();
  renderTodos();
  save();
};

/* ========================= PICKERS ========================= */
iconPickerEl.onchange = () => {
  const list = lists.find((l) => l.id === currentListId);
  list.icon = iconPickerEl.value;
  renderLists();
  save();
};

colorPickerEl.oninput = () => {
  const list = lists.find((l) => l.id === currentListId);
  list.color = colorPickerEl.value;
  renderLists();
  save();
};

listTitleEl.oninput = () => {
  const list = lists.find((l) => l.id === currentListId);
  list.name = listTitleEl.textContent;
  renderLists();
  save();
};

/* ========================= TOGGLE DONE ========================= */
function updateToggleDoneText() {
  toggleDoneBtn.textContent = showDone
    ? "Masquer les tâches terminées"
    : "Afficher les tâches terminées";
}

toggleDoneBtn.onclick = () => {
  showDone = !showDone;
  updateToggleDoneText();
  renderTodos();
};

/* ================= BURGER MENU ================= */

const burgerBtn = document.getElementById("burgerBtn");
const sidebar = document.getElementById("todoSidebar");
const overlay = document.getElementById("sidebarOverlay");

function openMenu() {
  sidebar.classList.add("open");
  overlay.classList.add("active");
  document.body.classList.add("menu-open");
  burgerBtn.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  sidebar.classList.remove("open");
  overlay.classList.remove("active");
  document.body.classList.remove("menu-open");
  burgerBtn.setAttribute("aria-expanded", "false");
}

burgerBtn.addEventListener("click", openMenu);
overlay.addEventListener("click", closeMenu);

// ferme quand on clique sur une liste
document.getElementById("lists").addEventListener("click", closeMenu);

/* ========================= ANIMATION ========================= */
function animateContent() {
  const el = document.querySelector(".todo-content");
  if (!el) return;
  el.classList.remove("fade");
  void el.offsetWidth;
  el.classList.add("fade");
}

/* ======================= INITIAL RENDER ======================= */
renderLists();
renderTodos();
updateToggleDoneText();

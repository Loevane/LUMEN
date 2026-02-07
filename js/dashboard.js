const todos = Storage.get("todos");
const habits = Storage.get("habits");
const goals = Storage.get("goals");

document.getElementById("todoPreview").textContent =
  `${todos.length} tâche(s) en attente`;

document.getElementById("habitPreview").textContent =
  `${habits.length} habitude(s)`;

document.getElementById("goalPreview").textContent =
  `${goals.length} objectif(s)`;

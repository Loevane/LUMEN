const form = document.getElementById("habitForm");
const input = document.getElementById("habitInput");
const list = document.getElementById("habitList");

let habits = JSON.parse(localStorage.getItem("habits")) || [];

function render() {
  list.innerHTML = "";
  habits.forEach((habit, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${habit}
      <button onclick="removeHabit(${index})">✕</button>
    `;
    list.appendChild(li);
  });
  localStorage.setItem("habits", JSON.stringify(habits));
}

form.addEventListener("submit", e => {
  e.preventDefault();
  habits.push(input.value);
  input.value = "";
  render();
});

function removeHabit(index) {
  habits.splice(index, 1);
  render();
}

render();

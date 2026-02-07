// ===================== UTILS =====================
const $ = (id) => document.getElementById(id);

const formatTime = (seconds) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
};

// ===================== QUOTES =====================
const quotes = [
  "Ce que tu fais aujourd’hui construit ton demain.",
  "La discipline est le pont entre tes objectifs et tes réussites.",
  "Avance, même lentement, mais avance chaque jour.",
  "Les petits progrès quotidiens mènent à de grandes transformations.",
];

$("daily-quote").textContent = quotes[new Date().getDate() % quotes.length];

// ===================== DATE & HEURE =====================
const updateDateTime = () => {
  const now = new Date();
  $("current-date").textContent = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  $("current-time").textContent = now.toLocaleTimeString("fr-FR");
};

updateDateTime();
setInterval(updateDateTime, 1000);

// ===================== COUNTS =====================
$("todoCount").textContent =
  JSON.parse(localStorage.getItem("todos"))?.length || 0;
$("habitCount").textContent =
  JSON.parse(localStorage.getItem("habits"))?.length || 0;

// ===================== PANELS =====================
const panels = ["stopwatch", "timer", "pomodoro"];
const togglePanel = (id) =>
  panels.forEach((p) => $(p).classList.toggle("hidden", p !== id));

$("openStopwatch").onclick = () => togglePanel("stopwatch");
$("openTimer").onclick = () => togglePanel("timer");
$("openPomodoro").onclick = () => togglePanel("pomodoro");

// ===================== STOPWATCH =====================
let chronoSec = 0,
  chronoInt = null;
$("startStopwatch").onclick = () => {
  if (chronoInt) return;
  chronoInt = setInterval(() => {
    chronoSec++;
    $("stopwatchTime").textContent = formatTime(chronoSec);
  }, 1000);
};
$("pauseStopwatch").onclick = () => {
  clearInterval(chronoInt);
  chronoInt = null;
};
$("resetStopwatch").onclick = () => {
  clearInterval(chronoInt);
  chronoInt = null;
  chronoSec = 0;
  $("stopwatchTime").textContent = "00:00";
};

// ===================== TIMER =====================
let timerSec = 0,
  timerInt = null;
$("startTimer").onclick = () => {
  if (!timerSec) timerSec = Number($("timerInput").value) * 60;
  if (!timerSec || timerInt) return;
  timerInt = setInterval(() => {
    timerSec--;
    $("timerDisplay").textContent = formatTime(timerSec);
    if (timerSec <= 0) {
      clearInterval(timerInt);
      timerInt = null;
      timerSec = 0;
      playBell();
      launchConfetti();
    }
  }, 1000);
};
$("pauseTimer").onclick = () => {
  clearInterval(timerInt);
  timerInt = null;
};

// ===================== POMODORO =====================
let pomoSec = 25 * 60,
  pomoInt = null;
const updatePomo = () => ($("pomodoroTime").textContent = formatTime(pomoSec));
updatePomo();
$("startPomodoro").onclick = () => {
  if (pomoInt) return;
  pomoInt = setInterval(() => {
    pomoSec--;
    updatePomo();
    if (pomoSec <= 0) {
      clearInterval(pomoInt);
      pomoInt = null;
      pomoSec = 25 * 60;
      playBell();
      launchConfetti();
      alert("🍅 Session terminée !");
      updatePomo();
    }
  }, 1000);
};
$("pausePomodoro").onclick = () => {
  clearInterval(pomoInt);
  pomoInt = null;
};
$("resetPomodoro").onclick = () => {
  clearInterval(pomoInt);
  pomoInt = null;
  pomoSec = 25 * 60;
  updatePomo();
};

// ===================== FX =====================
const playBell = () => {
  const bell = $("bell");
  bell.currentTime = 0;
  bell.play();
};
const launchConfetti = () => {
  for (let i = 0; i < 30; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2000);
  }
};

// ===================== METEO =====================
navigator.geolocation.getCurrentPosition(async (pos) => {
  const { latitude, longitude } = pos.coords;
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
  );
  const data = await res.json();
  $("weatherTemp").textContent =
    Math.round(data.current_weather.temperature) + "°C";
  $("weatherIcon").src =
    data.current_weather.weathercode === 0
      ? "assets/icons/sun.png"
      : "assets/icons/cloud.png";
});

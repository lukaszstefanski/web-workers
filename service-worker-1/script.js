const networkStatusEl = document.getElementById("networkStatus");
const swStatusEl = document.getElementById("swStatus");
const lastSyncEl = document.getElementById("lastSync");
const offlineBannerEl = document.getElementById("offlineBanner");

const noteForm = document.getElementById("noteForm");
const noteInput = document.getElementById("noteInput");
const notesList = document.getElementById("notesList");

const NOTES_STORAGE_KEY = "service-worker-notes";

function formatTime(date) {
  return date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function setNetworkStatus() {
  const isOnline = navigator.onLine;
  networkStatusEl.textContent = isOnline ? "online" : "offline";

  networkStatusEl.classList.remove(
    "badge--unknown",
    "badge--online",
    "badge--offline",
  );
  networkStatusEl.classList.add(isOnline ? "badge--online" : "badge--offline");

  offlineBannerEl.hidden = isOnline;
}

function updateLastSync() {
  lastSyncEl.textContent = formatTime(new Date());
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

function renderNotes(notes) {
  notesList.innerHTML = "";

  if (!notes.length) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "notes-list__item";
    emptyLi.textContent = "Brak notatek – dodaj pierwszą powyżej.";
    notesList.appendChild(emptyLi);
    return;
  }

  notes.forEach((note) => {
    const li = document.createElement("li");
    li.className = "notes-list__item";

    const textSpan = document.createElement("span");
    textSpan.className = "notes-list__text";
    textSpan.textContent = note.text;

    const metaSpan = document.createElement("span");
    metaSpan.className = "notes-list__meta";
    metaSpan.textContent = formatTime(new Date(note.createdAt));

    li.appendChild(textSpan);
    li.appendChild(metaSpan);
    notesList.appendChild(li);
  });
}

// Obsługa formularza notatek (działa zarówno online jak i offline)
noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = noteInput.value.trim();
  if (!value) return;

  const notes = loadNotes();
  notes.unshift({
    id: Date.now(),
    text: value,
    createdAt: Date.now(),
  });
  saveNotes(notes);
  renderNotes(notes);
  noteInput.value = "";
  updateLastSync();
});

// Inicjalizacja stanu przy starcie
setNetworkStatus();
renderNotes(loadNotes());

window.addEventListener("online", () => {
  setNetworkStatus();
  updateLastSync();
});

window.addEventListener("offline", () => {
  setNetworkStatus();
  updateLastSync();
});

// Rejestracja Service Workera – proxy między appką a siecią
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./serviceWorker.js")
      .then((registration) => {
        console.log(
          "[script.js] Service Worker zarejestrowany:",
          registration.scope,
        );
        swStatusEl.textContent = "zarejestrowany";
        swStatusEl.classList.remove("badge--unknown", "badge--error");
        swStatusEl.classList.add("badge--ok");
        updateLastSync();
      })
      .catch((error) => {
        console.error("[script.js] Błąd rejestracji Service Workera:", error);
        swStatusEl.textContent = "błąd";
        swStatusEl.classList.remove("badge--unknown");
        swStatusEl.classList.add("badge--error");
        updateLastSync();
      });
  });
} else {
  swStatusEl.textContent = "niewspierany";
  swStatusEl.classList.remove("badge--unknown");
  swStatusEl.classList.add("badge--error");
}

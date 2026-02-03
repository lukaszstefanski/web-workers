const statusEl = document.getElementById("status");
const resultsList = document.getElementById("resultsList");
const fetchBtn = document.getElementById("fetchBtn");
const clearLogBtn = document.getElementById("clearLogBtn");

let worker;

try {
  worker = new SharedWorker("./sharedWorker.js");
  worker.port.start();

  worker.port.addEventListener("message", (event) => {
    const { type, message, payload } = event.data || {};

    if (type === "status") {
      statusEl.textContent = message;
    }

    if (type === "data" && payload) {
      const { data, fromCache, timestamp } = payload;

      const li = document.createElement("li");
      li.innerHTML = `
        <span>
          <strong>ID:</strong> ${data.id}, 
          <strong>title:</strong> ${data.title}
          <span class="meta">(${timestamp})</span>
        </span>
        <span class="badge ${fromCache ? "cache" : "network"}">
          ${fromCache ? "z cache SharedWorkera" : "z sieci (fetch)"}
        </span>
      `;
      resultsList.prepend(li);
    }
  });

  statusEl.textContent = "Połączono z SharedWorkerem. Możesz otworzyć kolejne karty.";
} catch (error) {
  statusEl.textContent =
    "Twoja przeglądarka nie wspiera SharedWorker lub wystąpił błąd. Szczegóły w konsoli.";
  console.error(error);
}

fetchBtn.addEventListener("click", () => {
  if (!worker) return;
  worker.port.postMessage({ type: "getData" });
});

clearLogBtn.addEventListener("click", () => {
  resultsList.innerHTML = "";
  statusEl.textContent = "Wyczyszczono log. Możesz ponownie pobrać dane.";
});


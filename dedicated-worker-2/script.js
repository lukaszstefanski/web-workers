const recordsInput = document.getElementById("recordsCount");
const btnWithoutWorker = document.getElementById("btnWithoutWorker");
const btnWithWorker = document.getElementById("btnWithWorker");
const statusText = document.getElementById("statusText");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const logOutput = document.getElementById("logOutput");

const pdfWorker = new Worker("./worker.js");

function log(line) {
  const time = new Date().toLocaleTimeString();
  logOutput.textContent += `[${time}] ${line}\n`;
  logOutput.scrollTop = logOutput.scrollHeight;
}

function setStatus(message) {
  statusText.textContent = message;
}

function setProgress(percent) {
  const safe = Math.max(0, Math.min(100, percent));
  progressFill.style.width = `${safe}%`;
  progressLabel.textContent = `${safe}%`;
}

function setButtonsDisabled(disabled) {
  btnWithoutWorker.disabled = disabled;
  btnWithWorker.disabled = disabled;
}

function getRecordsCount() {
  const value = parseInt(recordsInput.value, 10);
  if (Number.isNaN(value) || value <= 0) {
    return 5000;
  }
  return value;
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatRecord(i) {
  const value = ((i * 17) % 9973) / 9973;
  const timestamp = new Date(Date.now() - (i % 86400000)).toISOString();
  return `${i},${value.toFixed(6)},${timestamp}\n`;
}

// Generowanie prawdziwego pliku CSV BEZ workera – blokuje UI
function generateFileBlocking(totalRecords) {
  const start = performance.now();
  setButtonsDisabled(true);
  setStatus(`(bez workera) Generowanie pliku dla ${totalRecords} rekordów...`);
  log(`(bez workera) Start generowania pliku.`);
  setProgress(0);

  const header = "id,value,timestamp\n";
  const reportEvery = Math.max(1, Math.floor(totalRecords / 50));
  const parts = [header];

  for (let i = 0; i < totalRecords; i++) {
    parts.push(formatRecord(i));
    if (i > 0 && i % reportEvery === 0) {
      const progress = Math.round((i / totalRecords) * 100);
      setProgress(progress);
    }
  }

  const csv = parts.join("");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const filename = `raport-${totalRecords}-rekordow-bez-workera.csv`;
  downloadFile(blob, filename);

  const durationMs = performance.now() - start;
  setProgress(100);
  setStatus(
    `(bez workera) Zakończono. Pobrano plik "${filename}" w ${durationMs.toFixed(
      0,
    )} ms.`,
  );
  log(
    `(bez workera) Gotowe. Czas: ${durationMs.toFixed(
      0,
    )} ms, rekordy: ${totalRecords}, plik: ${filename}`,
  );
  setButtonsDisabled(false);
}

btnWithoutWorker.addEventListener("click", () => {
  const totalRecords = getRecordsCount();
  requestAnimationFrame(() => {
    generateFileBlocking(totalRecords);
  });
});

// Z workerem: zbieramy chunki i na DONE tworzymy plik
let fileChunks = [];

btnWithWorker.addEventListener("click", () => {
  const totalRecords = getRecordsCount();
  fileChunks = [];

  setButtonsDisabled(true);
  setProgress(0);
  setStatus(`(worker) Start generowania pliku dla ${totalRecords} rekordów...`);
  log(`(worker) Start.`);

  pdfWorker.postMessage({
    type: "GENERATE_FILE",
    payload: { totalRecords },
  });
});

pdfWorker.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  if (type === "STATUS") {
    setStatus(`(worker) ${payload.message}`);
    log(`(worker) ${payload.message}`);
    return;
  }

  if (type === "FILE_CHUNK") {
    fileChunks.push(payload.chunk);
    return;
  }

  if (type === "PROGRESS") {
    const { progress, processed, totalRecords } = payload;
    setProgress(progress);
    setStatus(
      `(worker) Wygenerowano ${processed} / ${totalRecords} rekordów (${progress}%).`,
    );
    return;
  }

  if (type === "DONE") {
    const { durationMs, totalRecords } = payload;
    const blob = new Blob(fileChunks, { type: "text/csv;charset=utf-8" });
    const filename = `raport-${totalRecords}-rekordow-z-workerem.csv`;
    downloadFile(blob, filename);

    setProgress(100);
    setStatus(
      `(worker) Zakończono. Pobrano plik "${filename}" w ${durationMs.toFixed(
        0,
      )} ms.`,
    );
    log(
      `(worker) Gotowe. Czas: ${durationMs.toFixed(
        0,
      )} ms, rekordy: ${totalRecords}, plik: ${filename}`,
    );
    setButtonsDisabled(false);
    fileChunks = [];
  }
});

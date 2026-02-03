const input = document.getElementById("name");
const info = document.getElementById("info");

const worker = new SharedWorker("./sharedWorker.js");
worker.port.start(); // uruchomienie portu i pozwolenie na odbieranie wiadomości

input.addEventListener("input", () => {
  const value = input.value;
  worker.port.postMessage(value);
  info.textContent = "Wysłano do innych kart";
});

// alternatywnie worker.port.onmessage = (e) => { ... }
worker.port.addEventListener("message", (e) => {
  const value = e.data;

  if (input.value !== value) {
    input.value = value;
    info.textContent = "Zsynchronizowano z inną kartą";
  }
});

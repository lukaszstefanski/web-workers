const form = document.getElementById("myForm");
const mainScriptResult = document.getElementById("mainScriptResult");
const webWorkerResult = document.getElementById("webWorkerResult");

const worker = new Worker("./worker.js");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const inputNumber = document.getElementById("numberInput").value;

  mainScriptResult.textContent = inputNumber;

  worker.postMessage(inputNumber);

  form.reset();
});

// alternatywnie można użyć worker.onmessage = (e) => { ... }
worker.addEventListener("message", (e) => {
  webWorkerResult.textContent = e.data;
});

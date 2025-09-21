const form = document.getElementById("myForm");
const mainScriptResult = document.getElementById("mainScriptResult");
const webWorkerResult = document.getElementById("webWorkerResult");

const worker = new Worker("./worker.js");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const inputNumber = document.getElementById("numberInput").value;

  mainScriptResult.textContent = `Główny skrypt: ${inputNumber}`;

  worker.postMessage(inputNumber);

  form.reset();
});

worker.onmessage = (e) => {
  webWorkerResult.textContent = `Web worker: ${e.data}`;
};

// if ("serviceWorker" in navigator) {
//   navigator.serviceWorker
//     .register("serviceWorker.js")
//     .then(() => console.log("[script.js] Service worker zarejestrowany"))
//     .catch((err) => console.error("[script.js] Błąd:", err));
// }

const input = document.getElementById("name");
const text = document.getElementById("text");

input.addEventListener("input", () => {
  text.textContent = `Tekst: ${input.value}`;
});

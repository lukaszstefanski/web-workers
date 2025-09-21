// alternatywnie onMessage = (e) => { ... }
self.addEventListener("message", (e) => {
  postMessage(e.data * 2);
});

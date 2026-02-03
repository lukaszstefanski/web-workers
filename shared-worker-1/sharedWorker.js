const ports = [];

// alternatywnie onConnect = (e) => { ... }
self.addEventListener("connect", (e) => {
  const port = e.ports[0];
  ports.push(port); // dodanie portu kolejnej karty aplikacji
  port.start();

  port.onmessage = (e) => {
    const value = e.data;

    ports.forEach((p) => {
      if (p !== port) {
        p.postMessage(value);
      }
    });
  };
});

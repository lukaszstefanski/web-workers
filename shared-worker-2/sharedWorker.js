const ports = [];

let cachedData = null;
let isFetching = false;
let nextTodoId = 1;
const MAX_TODO_ID = 200; // jsonplaceholder ma 200 todos

function broadcast(message) {
  ports.forEach((port) => {
    try {
      port.postMessage(message);
    } catch (e) {
      // port mógł zostać zamknięty – ignorujemy
    }
  });
}

self.addEventListener("connect", (event) => {
  const port = event.ports[0];
  ports.push(port);
  port.start();

  port.postMessage({
    type: "STATUS",
    message: "Połączono z SharedWorkerem.",
  });

  // Jeśli mamy już dane w cache, od razu daj je nowej karcie
  if (cachedData) {
    port.postMessage({
      type: "DATA",
      payload: {
        data: cachedData,
        fromCache: true,
        timestamp: new Date().toLocaleTimeString(),
      },
    });
  }

  port.onmessage = (event) => {
    const { type } = event.data || {};

    if (type === "GET_DATA") {
      handleGetData(port);
    }
  };
});

function handleGetData(requestingPort) {
  // Jeśli fetch już trwa – nie rozpoczynaj kolejnego
  if (isFetching) {
    requestingPort.postMessage({
      type: "STATUS",
      message:
        "Trwa już pobieranie danych z API przez SharedWorkera – po zakończeniu wszyscy dostaną wynik.",
    });
    return;
  }

  const todoId = nextTodoId;
  nextTodoId = nextTodoId >= MAX_TODO_ID ? 1 : nextTodoId + 1;

  isFetching = true;
  broadcast({
    type: "STATUS",
    message:
      "Pobieram dane z API (todo #" +
      todoId +
      ", współdzielone między wszystkimi kartami)…",
  });

  // Proste, publiczne API tylko do demonstracji
  fetch(`https://jsonplaceholder.typicode.com/todos/${todoId}`)
    .then((response) => response.json())
    .then((data) => {
      cachedData = data;
      const timestamp = new Date().toLocaleTimeString();

      // Informacja dla wszystkich kart, że dane są już w cache
      broadcast({
        type: "STATUS",
        message: "Dane z API zostały pobrane i zapisane w cache SharedWorkera.",
      });

      // Odpowiedź dla karty, która zainicjowała żądanie – oznaczamy jako „z sieci”
      try {
        requestingPort.postMessage({
          type: "DATA",
          payload: {
            data: cachedData,
            fromCache: false,
            timestamp,
          },
        });
      } catch (e) {
        // port mógł zostać zamknięty – ignorujemy
      }

      // Pozostałe karty dostają od razu dane „z cache SharedWorkera”
      ports
        .filter((port) => port !== requestingPort)
        .forEach((port) => {
          try {
            port.postMessage({
              type: "DATA",
              payload: {
                data: cachedData,
                fromCache: true,
                timestamp,
              },
            });
          } catch (e) {
            // port mógł zostać zamknięty – ignorujemy
          }
        });
    })
    .catch((error) => {
      console.error("Błąd podczas pobierania danych w SharedWorkerze:", error);
      broadcast({
        type: "STATUS",
        message:
          "Wystąpił błąd podczas pobierania danych z API w SharedWorkerze. Szczegóły w konsoli.",
      });
    })
    .finally(() => {
      isFetching = false;
    });
}

// Dedicated Worker – generowanie prawdziwego pliku CSV w tle (w chunkach)

const CSV_HEADER = "id,value,timestamp\n";

function formatRecord(i) {
  const value = ((i * 17) % 9973) / 9973;
  const timestamp = new Date(Date.now() - (i % 86400000)).toISOString();
  return `${i},${value.toFixed(6)},${timestamp}\n`;
}

self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  if (type !== "GENERATE_FILE") {
    return;
  }

  const { totalRecords } = payload;

  postMessage({
    type: "STATUS",
    payload: {
      message: `Worker: start generowania pliku dla ${totalRecords} rekordów...`,
    },
  });

  postMessage({
    type: "FILE_CHUNK",
    payload: { chunk: CSV_HEADER },
  });

  const start = Date.now();
  const chunkSize = Math.max(5000, Math.floor(totalRecords / 100));
  let processed = 0;

  function sendNextChunk() {
    const endFor = Math.min(processed + chunkSize, totalRecords);
    const parts = [];

    for (let i = processed; i < endFor; i++) {
      parts.push(formatRecord(i));
    }

    processed = endFor;
    const progress = Math.round((processed / totalRecords) * 100);

    postMessage({
      type: "FILE_CHUNK",
      payload: { chunk: parts.join("") },
    });

    postMessage({
      type: "PROGRESS",
      payload: { processed, totalRecords, progress },
    });

    if (processed < totalRecords) {
      setTimeout(sendNextChunk, 0);
    } else {
      const durationMs = Date.now() - start;
      postMessage({
        type: "DONE",
        payload: { durationMs, totalRecords },
      });
    }
  }

  sendNextChunk();
});

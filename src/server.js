import http from 'http';
import app from './app.js';
import initSockets from './sockets/index.js';
const server = http.createServer(app);
import https from "https";

// Inicializar sockets
initSockets(server);
setInterval(() => {
  https.get("https://capptourback.onrender.com", (res) => {
    console.log(`Ping enviado, status code: ${res.statusCode}`);
  }).on("error", (err) => {
    console.error("Error en auto-ping:", err.message);
  });
}, 7000); // 120,000 ms = 2 minutos
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

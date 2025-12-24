import http from 'http';
import app from './app.js';
import initSockets from './sockets/index.js';

const server = http.createServer(app);

// Inicializar sockets
initSockets(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

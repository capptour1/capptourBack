import { Server } from 'socket.io';
import http from 'http';
import app from './src/app.js';
import { handleChat } from './chatHandler.js';
import { initReservas } from './reservasHandler.js';

const server = http.createServer(app);
export const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] },
});

export const usuariosConectados = new Map();

// Inicializar handlers
handleChat(io, usuariosConectados);
initReservas(io, usuariosConectados);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Socket.IO corriendo en puerto ${PORT}`));

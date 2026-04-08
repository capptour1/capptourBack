import { Server } from 'socket.io';
import chatSocket from './chat.socket.js';
//import requestSocket from './request.socket.js';

export default function initSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: '*', // ⚠️ luego limita
      methods: ['GET', 'POST'],
      transports: ['websocket']
    }
  });

  console.log('🟢 Socket.IO inicializado');

  // Middleware global (auth futura)
  io.use((socket, next) => {
    console.log("🔐 Auth recibido:", socket.handshake.auth);
    next();
  });
  /*
    io.use((socket, next) => {
      try {
          const token = socket.handshake.auth.token;

          const payload = verifyJwt(token);
          socket.user = payload.user; // 👈 aquí
          next();
        next();
      } catch (err) {
        next(new Error('Token inválido'));
      }
    });
  */

  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);



    chatSocket(io, socket);
    //requestSocket(io, socket);

    socket.on('disconnect', () => {
      console.log('❌ Cliente desconectado:', socket.id);
    });
  });
}

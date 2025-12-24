import { Server } from 'socket.io';
import chatSocket from './chat.socket.js';
//import requestSocket from './request.socket.js';

export default function initSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: '*', // ⚠️ luego limita
      methods: ['GET', 'POST']
    }
  });

  console.log('🟢 Socket.IO inicializado');

  // Middleware global (auth futura)
  io.use((socket, next) => {
    // validar JWT aquí
    // socket.user = decodedUser;
    next();
  });
  /*
    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
  
        if (!token) {
          return next(new Error('Token requerido'));
        }
  
        const user = verifyJwt(token);
  
        socket.user = user;
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

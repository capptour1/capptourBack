import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import chatSocket from './chat.socket.js';
import requestSocket from './request.socket.js';
import notificationSocket from './notification.socket.js';
import locationSocket from './location.socket.js';

const SECRET_KEY = process.env.JWT_SECRET || 'secret_key';

// Instancia global de io — se exporta para que los servicios puedan emitir
let _io = null;
export const getIo = () => _io;

export default function initSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      transports: ['websocket'],
    },
  });

  _io = io;
  console.log('🟢 Socket.IO inicializado');

  // ── Middleware de autenticación JWT ──────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Token requerido'));
      }
      const payload = jwt.verify(token, SECRET_KEY);
      socket.user = { id: payload.userId, userType: payload.userType };
      next();
    } catch (err) {
      console.warn('⚠️  Token inválido en socket:', err.message);
      return next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id} user=${socket.user.id}`);

    // ── Unirse al room personal del usuario (automático, basado en JWT) ───
    socket.join(`user_${socket.user.id}`);

    // ── Registrar handlers ────────────────────────────────────────────────
    chatSocket(io, socket);
    requestSocket(io, socket);
    notificationSocket(io, socket);
    locationSocket(io, socket);

    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
  });
}

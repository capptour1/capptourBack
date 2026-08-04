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
        // Permitir conexión sin token (compatibilidad con versiones anteriores)
        // pero socket.user quedará undefined
        console.warn('⚠️  Socket sin token — conexión anónima');
        return next();
      }
      const payload = jwt.verify(token, SECRET_KEY);
      socket.user = { id: payload.userId, role: payload.role };
      next();
    } catch (err) {
      console.warn('⚠️  Token inválido en socket:', err.message);
      // No rechazamos para no romper clientes existentes; socket.user = undefined
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}  user=${socket.user?.id ?? 'anon'}`);

    // ── Unirse al room personal del usuario ──────────────────────────────
    // El cliente también puede emitir 'join_user' manualmente (compatibilidad)
    if (socket.user?.id) {
      socket.join(`user_${socket.user.id}`);
      console.log(`👤 Usuario ${socket.user.id} unido a room user_${socket.user.id}`);
    }

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

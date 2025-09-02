import pool from './src/db.js';

export function handleChat(io, usuariosConectados) {
  io.on('connection', (socket) => {
    console.log('🟢 Cliente conectado (chat):', socket.id);

    socket.on('join', (userId) => {
      usuariosConectados.set(userId, socket.id);
      console.log(`👤 Usuario ${userId} conectado con socket ${socket.id}`);
    });

    socket.on('send_message', async ({ from, to, message }) => {
      try {
        await pool.query(
          `INSERT INTO chat.mensajes (remitente_id, destinatario_id, mensaje) VALUES ($1,$2,$3)`,
          [from, to, message]
        );

        const receptorSocketId = usuariosConectados.get(to);
        if (receptorSocketId) {
          io.to(receptorSocketId).emit('receive_message', { from, message, timestamp: new Date() });
        }
      } catch (error) {
        console.error(error);
        socket.emit('error_message', { message: 'No se pudo enviar el mensaje.' });
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of usuariosConectados.entries()) {
        if (socketId === socket.id) usuariosConectados.delete(userId);
      }
    });
  });
}

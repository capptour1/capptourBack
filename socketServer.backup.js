// socketServer.js
import { Server } from 'socket.io';
import http from 'http';
import app from './src/app.js';
import pool from './src/db.js'; // Asegúrate de que la ruta sea correcta

// 🟢 Confirmación clara de que se está ejecutando este archivo
console.log('✅ Ejecutando desde socketServer.js');

// Crear servidor HTTP base con Express
const server = http.createServer(app);

// Inicializar Socket.IO encima del servidor HTTP
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Almacenar usuarios conectados
const usuariosConectados = new Map();

io.on('connection', (socket) => {
    console.log('🟢 Nuevo cliente conectado:', socket.id);

    socket.on('join', (userId) => {
        usuariosConectados.set(userId, socket.id);
        console.log(`👤 Usuario ${userId} conectado con socket ${socket.id}`);
    });

    socket.on('send_message', async ({ from, to, message }) => {
        try {
            // Guardar mensaje en la base de datos
            await pool.query(
                `INSERT INTO chat.mensajes (remitente_id, destinatario_id, mensaje)
         VALUES ($1, $2, $3)`,
                [from, to, message]
            );

            console.log(`💬 Mensaje guardado de ${from} → ${to}`);

            // Enviar mensaje al destinatario si está conectado
            const receptorSocketId = usuariosConectados.get(to);

            if (receptorSocketId) {
                io.to(receptorSocketId).emit('receive_message', {
                    from,
                    message,
                    timestamp: new Date(),
                });
                console.log(`📨 Enviado a usuario ${to} por socket`);
            } else {
                console.log(`🔕 Usuario ${to} no está conectado`);
            }
        } catch (error) {
            console.error('❌ Error al guardar o enviar mensaje:', error);
            socket.emit('error_message', { message: 'No se pudo enviar el mensaje.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('🔴 Usuario desconectado:', socket.id);
        for (const [userId, socketId] of usuariosConectados.entries()) {
            if (socketId === socket.id) {
                usuariosConectados.delete(userId);
                break;
            }
        }
    });
});

// Lanzar servidor en puerto 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Socket.IO server corriendo en puerto ${PORT}`);
});

// Solo funciones para emitir reservas
export function initReservas(io, usuariosConectados) {
    console.log('✅ Reservas handler inicializado');

    io.on('connection', (socket) => {
        console.log('🟢 Cliente conectado (reservas):', socket.id);

        // El cliente se une a un room de request
        socket.on('join-request-room', ({ requestId }) => {
            socket.join(`request:${requestId}`);
            console.log(`📌 Socket ${socket.id} se unió al room request:${requestId}`);
        });

        socket.on('leave-request-room', ({ requestId }) => {
            socket.leave(`request:${requestId}`);
            console.log(`📌 Socket ${socket.id} salió del room request:${requestId}`);
        });
    });
}



export function emitirReserva(io, requestId, reserva) {
    console.log(`📨 Reserva enviada a request ${requestId}`);
    io.to(`request:${requestId}`).emit('request:' + requestId, {
        reserva: reserva
    });
}

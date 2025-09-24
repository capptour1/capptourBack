import pool from './src/db.js';

export function initFotoInmediata(io, usuariosConectados) {
    console.log('✅ Foto Inmediata handler inicializado');

    io.on('connection', (socket) => {
        console.log('🟢 Cliente conectado (foto inmediata):', socket.id);

        // Unirse a room de fotógrafo
        socket.on('join-fotografo', ({ fotografoId }) => {
            socket.join(`fotografo:${fotografoId}`);
            console.log(`📸 Fotógrafo ${fotografoId} unido al room fotografo:${fotografoId}`);

            // ✅ DEBUG: Verificar clients en el room
            const room = io.sockets.adapter.rooms.get(`fotografo:${fotografoId}`);
            console.log(`👥 Clientes en room fotografo:${fotografoId}:`, room ? Array.from(room) : 'Vacío');
        });

        // Unirse a room de usuario
        socket.on('join-usuario', ({ usuarioId }) => {
            socket.join(`usuario:${usuarioId}`);
            console.log(`👤 Usuario ${usuarioId} unido al room usuario:${usuarioId}`);
        });

        // Solicitud de foto desde usuario
        socket.on('solicitar-foto', async ({ fotografoId, usuarioId, usuarioNombre }) => {
            try {
                console.log('📨 Evento solicitar-foto recibido:', { fotografoId, usuarioId, usuarioNombre });

                // ✅ VALIDAR DATOS
                if (!fotografoId || fotografoId === 'null') {
                    console.log('❌ fotografoId inválido');
                    return;
                }

                const fotografoIdNum = parseInt(fotografoId);
                const usuarioIdNum = parseInt(usuarioId);

                // ✅ OBTENER fotografo_id REAL
                const fotografoResult = await pool.query(
                    'SELECT f.id as fotografo_id FROM fotografo.fotografos f WHERE f.usuario_id = $1',
                    [fotografoIdNum]
                );

                if (fotografoResult.rows.length === 0) {
                    console.log('❌ Fotógrafo no encontrado');
                    return;
                }

                const fotografoRealId = fotografoResult.rows[0].fotografo_id;

                // ✅ INSERTAR SOLICITUD
                const result = await pool.query(
                    'INSERT INTO fotografo.solicitudes_foto (fotografo_id, usuario_id, estado) VALUES ($1, $2, $3) RETURNING *',
                    [fotografoRealId, usuarioIdNum, 'pendiente']
                );

                const solicitud = result.rows[0];
                console.log('✅ Solicitud guardada ID:', solicitud.id);

                // ✅ 🔥 SOLUCIÓN DEFINITIVA: Buscar TODOS los sockets del fotógrafo
                const fotografoSockets = [];

                // Buscar en todos los sockets conectados
                const sockets = await io.fetchSockets();
                for (const clientSocket of sockets) {
                    // Si este socket pertenece al fotógrafo
                    if (clientSocket.rooms.has(`fotografo:${fotografoIdNum}`)) {
                        fotografoSockets.push(clientSocket.id);
                    }
                }

                console.log(`🔍 Sockets del fotógrafo ${fotografoIdNum}:`, fotografoSockets);

                if (fotografoSockets.length > 0) {
                    // ✅ ENVIAR A TODOS los sockets del fotógrafo
                    fotografoSockets.forEach(socketId => {
                        // ✅ ENVIAR A MÚLTIPLES EVENTOS
                        const eventos = [
                            'nueva_solicitud_foto',      // guion bajo
                            'nueva-solicitud-foto',      // guion medio (original)
                            'nuevasolicitudfoto',        // sin guiones
                            'new_photo_request'          // inglés
                        ];

                        eventos.forEach(evento => {
                            io.to(socketId).emit(evento, {
                                solicitudId: solicitud.id,
                                usuarioId: usuarioIdNum,
                                usuarioNombre: usuarioNombre,
                                fecha: new Date().toISOString()
                            });
                            console.log(`📤 Enviado a evento: ${evento}`);
                        });
                    });
                    console.log(`📤 Notificación enviada a ${fotografoSockets.length} socket(s) del fotógrafo`);
                } else {
                    console.log('⚠️ Fotógrafo no tiene sockets activos');
                }

                // ✅ CONFIRMAR AL USUARIO
                socket.emit('solicitud-enviada', {
                    solicitudId: solicitud.id,
                    mensaje: 'Solicitud enviada al fotógrafo'
                });

            } catch (error) {
                console.error('❌ Error en solicitar-foto:', error);
            }
        });

        // Fotógrafo acepta solicitud
        socket.on('aceptar-solicitud', async ({ solicitudId }) => {
            try {
                console.log(`✅ Aceptando solicitud: ${solicitudId}`);

                await pool.query(
                    'UPDATE fotografo.solicitudes_foto SET estado = $1 WHERE id = $2',
                    ['aceptada', solicitudId]
                );

                const solicitudData = await pool.query(`
                    SELECT s.*, u.nombre_completo as usuario_nombre 
                    FROM fotografo.solicitudes_foto s 
                    JOIN auth.usuarios u ON s.usuario_id = u.id 
                    WHERE s.id = $1
                `, [solicitudId]);

                const solicitud = solicitudData.rows[0];

                // Notificar al usuario
                io.to(`usuario:${solicitud.usuario_id}`).emit('solicitud-aceptada', {
                    solicitudId: solicitudId,
                    mensaje: 'El fotógrafo ha aceptado tu solicitud'
                });

                // Notificar al fotógrafo que puede tomar la foto
                socket.emit('puede-tomar-foto', {
                    solicitudId: solicitudId,
                    usuarioId: solicitud.usuario_id,
                    usuarioNombre: solicitud.usuario_nombre
                });

                console.log('✅ Solicitud aceptada y notificaciones enviadas');

            } catch (error) {
                console.error('❌ Error aceptando solicitud:', error);
                socket.emit('error-aceptar', {
                    message: 'Error al aceptar solicitud'
                });
            }
        });

        // Fotógrafo rechaza solicitud
        socket.on('rechazar-solicitud', async ({ solicitudId }) => {
            try {
                console.log(`❌ Rechazando solicitud: ${solicitudId}`);

                await pool.query(
                    'UPDATE fotografo.solicitudes_foto SET estado = $1 WHERE id = $2',
                    ['rechazada', solicitudId]
                );

                const solicitudData = await pool.query(
                    'SELECT usuario_id FROM fotografo.solicitudes_foto WHERE id = $1',
                    [solicitudId]
                );

                if (solicitudData.rows.length > 0) {
                    io.to(`usuario:${solicitudData.rows[0].usuario_id}`).emit('solicitud-rechazada', {
                        solicitudId: solicitudId,
                        mensaje: 'El fotógrafo ha rechazado tu solicitud'
                    });
                    console.log('✅ Solicitud rechazada y usuario notificado');
                } else {
                    console.log('❌ No se encontró la solicitud para rechazar');
                }

            } catch (error) {
                console.error('❌ Error rechazando solicitud:', error);
            }
        });

        // Foto tomada por fotógrafo
        socket.on('foto-tomada', async ({ solicitudId, fotoUrl }) => {
            try {
                console.log(`📷 Foto tomada para solicitud: ${solicitudId}`);

                const solicitudData = await pool.query(`
                    SELECT s.*, u.nombre_completo as usuario_nombre 
                    FROM fotografo.solicitudes_foto s 
                    JOIN auth.usuarios u ON s.usuario_id = u.id 
                    WHERE s.id = $1
                `, [solicitudId]);

                if (solicitudData.rows.length === 0) {
                    console.log('❌ Solicitud no encontrada para foto');
                    return;
                }

                const solicitud = solicitudData.rows[0];

                // Guardar foto en BD
                const fotoResult = await pool.query(
                    `INSERT INTO fotografo.fotos_inmediatas 
                     (fotografo_id, usuario_id, foto_url) 
                     VALUES ($1, $2, $3) RETURNING *`,
                    [solicitud.fotografo_id, solicitud.usuario_id, fotoUrl]
                );

                // Marcar solicitud como completada
                await pool.query(
                    'UPDATE fotografo.solicitudes_foto SET estado = $1 WHERE id = $2',
                    ['completada', solicitudId]
                );

                // Notificar a AMBOS usuarios
                io.to(`usuario:${solicitud.usuario_id}`).emit('foto-guardada', {
                    solicitudId: solicitudId,
                    fotoUrl: fotoUrl,
                    mensaje: '¡Tu foto ha sido guardada exitosamente!'
                });

                socket.emit('foto-procesada', {
                    solicitudId: solicitudId,
                    usuarioNombre: solicitud.usuario_nombre,
                    fotoUrl: fotoUrl,
                    mensaje: 'Foto guardada exitosamente'
                });

                console.log('✅ Foto guardada y notificaciones enviadas');

            } catch (error) {
                console.error('❌ Error guardando foto:', error);
                socket.emit('error-foto', {
                    message: 'Error al guardar la foto'
                });
            }
        });

        // Manejar errores de socket
        socket.on('error', (error) => {
            console.error('❌ Error de socket:', error);
        });

        socket.on('disconnect', (reason) => {
            console.log('🔴 Cliente desconectado (foto inmediata):', socket.id, 'Razón:', reason);
        });

        // Evento de ping para verificar conexión
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date().toISOString() });
        });
    });

    // Log periódico de rooms activos
    setInterval(() => {
        const rooms = io.sockets.adapter.rooms;
        console.log('🏠 Rooms activos:', Array.from(rooms.keys()));
    }, 30000); // Cada 30 segundos
}
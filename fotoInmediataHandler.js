import pool from './src/db.js';

export function initFotoInmediata(io, usuariosConectados) {
    console.log('✅ Foto Inmediata handler inicializado');

    io.on('connection', (socket) => {
        console.log('🟢 Cliente conectado (foto inmediata):', socket.id);

        // Unirse a room de fotógrafo
        socket.on('join-fotografo', ({ fotografoId }) => {
            socket.join(`fotografo:${fotografoId}`);
            console.log(`📸 Fotógrafo ${fotografoId} unido al room fotografo:${fotografoId}`);

            const room = io.sockets.adapter.rooms.get(`fotografo:${fotografoId}`);
            console.log(`👥 Clientes en room fotografo:${fotografoId}:`, room ? Array.from(room) : 'Vacío');
        });

        // Unirse a room de usuario
        socket.on('join-usuario', ({ usuarioId }) => {
            socket.join(`usuario:${usuarioId}`);
            console.log(`👤 Usuario ${usuarioId} unido al room usuario:${usuarioId}`);
        });

        // SOLUCIÓN DEFINITIVA - SOLICITAR FOTO
        socket.on('solicitar-foto', async ({ fotografoId, usuarioId, usuarioNombre }) => {
            try {
                console.log('🎯 SOLICITUD RECIBIDA - Iniciando proceso...');
                console.log('📨 Datos:', { fotografoId, usuarioId, usuarioNombre });

                if (!fotografoId || fotografoId === 'null') {
                    console.log('❌ fotografoId inválido');
                    return;
                }

                const fotografoUsuarioId = parseInt(fotografoId);
                const usuarioIdNum = parseInt(usuarioId);

                // OBTENER FOTÓGRAFO
                const fotografoResult = await pool.query(
                    'SELECT id as fotografo_id FROM fotografo.fotografos WHERE usuario_id = $1',
                    [fotografoUsuarioId]
                );

                if (fotografoResult.rows.length === 0) {
                    console.log('❌ Fotógrafo no encontrado');
                    return;
                }

                const fotografoRealId = fotografoResult.rows[0].fotografo_id;

                // GUARDAR SOLICITUD
                const result = await pool.query(
                    'INSERT INTO fotografo.solicitudes_foto (fotografo_id, usuario_id, estado) VALUES ($1, $2, $3) RETURNING *',
                    [fotografoRealId, usuarioIdNum, 'pendiente']
                );

                const solicitud = result.rows[0];
                console.log('✅ Solicitud guardada ID:', solicitud.id);

                // SOLUCIÓN DEFINITIVA: ESPERAR RECONEXIÓN
                console.log('⏳ Esperando 3 segundos para reconexión del fotógrafo...');
                await new Promise(resolve => setTimeout(resolve, 3000));

                // CAPA 1: ENVIAR AL ROOM
                const room = io.sockets.adapter.rooms.get(`fotografo:${fotografoUsuarioId}`);
                const socketsEnRoom = room ? Array.from(room) : [];

                console.log(`🔍 Sockets en room: ${socketsEnRoom.length}`);

                const datosSolicitud = {
                    solicitudId: solicitud.id,
                    usuarioId: usuarioIdNum,
                    usuarioNombre: usuarioNombre,
                    fecha: new Date().toISOString()
                };

                if (socketsEnRoom.length > 0) {
                    io.to(`fotografo:${fotografoUsuarioId}`).emit('solicitud', {
                        id: solicitud.id,
                        usuario: usuarioNombre,
                        userId: usuarioIdNum,
                        fecha: new Date().toISOString()
                    });
                    console.log(`📤 ENVIADO AL ROOM: fotografo:${fotografoUsuarioId}`);
                } else {
                    // CAPA 2: BUSCAR SOCKETS DEL FOTÓGRAFO
                    console.log('🚨 Buscando sockets del fotógrafo...');
                    const allSockets = await io.fetchSockets();
                    const fotografoSockets = allSockets.filter(s =>
                        s.rooms.has(`fotografo:${fotografoUsuarioId}`)
                    );

                    console.log(`🔍 Sockets del fotógrafo: ${fotografoSockets.length}`);

                    if (fotografoSockets.length > 0) {
                        fotografoSockets.forEach(s => {
                            s.emit('nueva-solicitud-foto', datosSolicitud);
                        });
                        console.log(`📤 ENVIADO A SOCKETS: ${fotografoSockets.length}`);
                    } else {
                        // CAPA 3: BROADCAST TOTAL
                        console.log('🔥 ENVIANDO BROADCAST TOTAL...');
                        io.emit('nueva-solicitud-foto', {
                            ...datosSolicitud,
                            debug: 'BROADCAST_TOTAL'
                        });
                    }
                }

                // CONFIRMAR AL USUARIO
                socket.emit('solicitud-enviada', {
                    solicitudId: solicitud.id,
                    mensaje: 'Solicitud enviada al fotógrafo'
                });

                console.log('✅ Proceso completado');

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

                // Notificar al fotógrafo
                socket.emit('puede-tomar-foto', {
                    solicitudId: solicitudId,
                    usuarioId: solicitud.usuario_id,
                    usuarioNombre: solicitud.usuario_nombre
                });

                console.log('✅ Solicitud aceptada');

            } catch (error) {
                console.error('❌ Error aceptando solicitud:', error);
                socket.emit('error-aceptar', { message: 'Error al aceptar solicitud' });
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
                    console.log('✅ Solicitud rechazada');
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

                if (solicitudData.rows.length === 0) return;

                const solicitud = solicitudData.rows[0];

                // Guardar foto en BD
                await pool.query(
                    `INSERT INTO fotografo.fotos_inmediatas 
                     (fotografo_id, usuario_id, foto_url) 
                     VALUES ($1, $2, $3) RETURNING *`,
                    [solicitud.fotografo_id, solicitud.usuario_id, fotoUrl]
                );

                // Marcar como completada
                await pool.query(
                    'UPDATE fotografo.solicitudes_foto SET estado = $1 WHERE id = $2',
                    ['completada', solicitudId]
                );

                // Notificar a usuario
                io.to(`usuario:${solicitud.usuario_id}`).emit('foto-guardada', {
                    solicitudId: solicitudId,
                    fotoUrl: fotoUrl,
                    mensaje: '¡Foto guardada exitosamente!'
                });

                // Notificar a fotógrafo
                socket.emit('foto-procesada', {
                    solicitudId: solicitudId,
                    usuarioNombre: solicitud.usuario_nombre,
                    fotoUrl: fotoUrl,
                    mensaje: 'Foto guardada exitosamente'
                });

                console.log('✅ Foto guardada');

            } catch (error) {
                console.error('❌ Error guardando foto:', error);
                socket.emit('error-foto', { message: 'Error al guardar la foto' });
            }
        });

        // Manejar desconexión
        socket.on('disconnect', (reason) => {
            console.log('🔴 Cliente desconectado (foto inmediata):', socket.id, 'Razón:', reason);
        });

        // Ping/pong
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date().toISOString() });
        });
    });

    //Debug de rooms cada 20 segundos
    setInterval(() => {
        const rooms = io.sockets.adapter.rooms;
        const fotoRooms = Array.from(rooms.keys()).filter(room =>
            room.startsWith('fotografo:') || room.startsWith('usuario:')
        );
        console.log('🏠 Rooms activos (foto):', fotoRooms);
    }, 20000);
} 
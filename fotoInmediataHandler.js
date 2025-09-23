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
                if (!fotografoId || fotografoId === 'null' || fotografoId === 'undefined') {
                    console.log('❌ fotografoId inválido:', fotografoId);
                    socket.emit('error-solicitud', { message: 'ID de fotógrafo inválido' });
                    return;
                }

                const fotografoIdNum = parseInt(fotografoId);
                const usuarioIdNum = parseInt(usuarioId);

                if (isNaN(fotografoIdNum) || isNaN(usuarioIdNum)) {
                    console.log('❌ IDs no son números válidos:', { fotografoId, usuarioId });
                    socket.emit('error-solicitud', { message: 'IDs deben ser números válidos' });
                    return;
                }

                // ✅ OBTENER EL fotografo_id REAL DE LA BASE DE DATOS
                console.log(`🔍 Buscando fotografo_id para usuario_id: ${fotografoIdNum}`);
                const fotografoQuery = `
                    SELECT f.id as fotografo_id 
                    FROM fotografo.fotografos f 
                    WHERE f.usuario_id = $1
                `;
                const fotografoResult = await pool.query(fotografoQuery, [fotografoIdNum]);

                if (fotografoResult.rows.length === 0) {
                    console.log('❌ No se encontró fotógrafo para usuario_id:', fotografoIdNum);
                    socket.emit('error-solicitud', { message: 'Fotógrafo no encontrado en BD' });
                    return;
                }

                const fotografoRealId = fotografoResult.rows[0].fotografo_id;
                console.log('🔍 Fotógrafo real ID:', fotografoRealId, 'para usuario_id:', fotografoIdNum);

                console.log(`📸 Nueva solicitud de ${usuarioNombre} para fotógrafo ${fotografoRealId}`);

                // ✅ USAR EL fotografo_id REAL EN LUGAR DEL usuario_id
                const query = `
                    INSERT INTO fotografo.solicitudes_foto 
                    (fotografo_id, usuario_id, estado) 
                    VALUES ($1, $2, 'pendiente') 
                    RETURNING *
                `;

                const result = await pool.query(query, [fotografoRealId, usuarioIdNum]);
                const solicitud = result.rows[0];
                console.log('✅ Solicitud guardada en BD con ID:', solicitud.id);

                // ✅ DEBUG ANTES DE EMITIR
                const targetRoom = `fotografo:${fotografoIdNum}`;
                const roomClients = io.sockets.adapter.rooms.get(targetRoom);
                console.log(`🔊 Emitiendo a room: ${targetRoom}`);
                console.log(`👥 Clientes en room:`, roomClients ? Array.from(roomClients) : 'Vacío');

                // ✅ NOTIFICAR AL FOTÓGRAFO USANDO SU usuario_id
                io.to(targetRoom).emit('nueva-solicitud-foto', {
                    solicitudId: solicitud.id,
                    usuarioId: usuarioIdNum,
                    usuarioNombre: usuarioNombre,
                    fecha: new Date().toISOString()
                });

                console.log('📤 Notificación enviada a fotógrafo');

                // ✅ CONFIRMAR AL USUARIO
                socket.emit('solicitud-enviada', {
                    solicitudId: solicitud.id,
                    mensaje: 'Solicitud enviada al fotógrafo'
                });

                console.log('✅ Flujo de solicitud completado exitosamente');

            } catch (error) {
                console.error('❌ Error en solicitar-foto:', error);
                socket.emit('error-solicitud', {
                    message: 'Error al enviar solicitud: ' + error.message
                });
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
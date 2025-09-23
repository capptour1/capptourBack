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

        // ... (mantener el resto del código igual que tenías)

        socket.on('disconnect', () => {
            console.log('🔴 Cliente desconectado (foto inmediata):', socket.id);
        });
    });
}
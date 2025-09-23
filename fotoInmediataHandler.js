import pool from './src/db.js';

export function initFotoInmediata(io, usuariosConectados) {
    console.log('✅ Foto Inmediata handler inicializado');

    io.on('connection', (socket) => {
        console.log('🟢 Cliente conectado (foto inmediata):', socket.id);

        // Unirse a room de fotógrafo
        socket.on('join-fotografo', ({ fotografoId }) => {
            socket.join(`fotografo:${fotografoId}`);
            console.log(`📸 Fotógrafo ${fotografoId} unido al room fotografo:${fotografoId}`);
        });

        // Unirse a room de usuario
        socket.on('join-usuario', ({ usuarioId }) => {
            socket.join(`usuario:${usuarioId}`);
            console.log(`👤 Usuario ${usuarioId} unido al room usuario:${usuarioId}`);
        });

        // Solicitud de foto desde usuario
        socket.on('solicitar-foto', async ({ fotografoId, usuarioId, usuarioNombre }) => {
            try {
                console.log(`📸 Nueva solicitud de ${usuarioNombre} para fotógrafo ${fotografoId}`);

                // Guardar solicitud en BD
                const query = `
                    INSERT INTO fotografo.solicitudes_foto 
                    (fotografo_id, usuario_id, estado) 
                    VALUES ($1, $2, 'pendiente') 
                    RETURNING *
                `;

                const result = await pool.query(query, [fotografoId, usuarioId]);
                const solicitud = result.rows[0];

                // Notificar al fotógrafo
                io.to(`fotografo:${fotografoId}`).emit('nueva-solicitud-foto', {
                    solicitudId: solicitud.id,
                    usuarioId: usuarioId,
                    usuarioNombre: usuarioNombre,
                    fecha: new Date().toISOString()
                });

                // Confirmar al usuario
                socket.emit('solicitud-enviada', {
                    solicitudId: solicitud.id,
                    mensaje: 'Solicitud enviada al fotógrafo'
                });

            } catch (error) {
                console.error('Error en solicitar-foto:', error);
                socket.emit('error-solicitud', {
                    message: 'Error al enviar solicitud'
                });
            }
        });

        // Fotógrafo acepta solicitud
        socket.on('aceptar-solicitud', async ({ solicitudId }) => {
            try {
                // Actualizar estado en BD
                await pool.query(
                    'UPDATE fotografo.solicitudes_foto SET estado = "aceptada" WHERE id = $1',
                    [solicitudId]
                );

                // Obtener datos de la solicitud
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

            } catch (error) {
                console.error('Error aceptando solicitud:', error);
                socket.emit('error-aceptar', {
                    message: 'Error al aceptar solicitud'
                });
            }
        });

        // Fotógrafo rechaza solicitud
        socket.on('rechazar-solicitud', async ({ solicitudId }) => {
            try {
                await pool.query(
                    'UPDATE fotografo.solicitudes_foto SET estado = "rechazada" WHERE id = $1',
                    [solicitudId]
                );

                const solicitudData = await pool.query(
                    'SELECT usuario_id FROM fotografo.solicitudes_foto WHERE id = $1',
                    [solicitudId]
                );

                io.to(`usuario:${solicitudData.rows[0].usuario_id}`).emit('solicitud-rechazada', {
                    solicitudId: solicitudId,
                    mensaje: 'El fotógrafo ha rechazado tu solicitud'
                });

            } catch (error) {
                console.error('Error rechazando solicitud:', error);
            }
        });

        // Foto tomada por fotógrafo
        socket.on('foto-tomada', async ({ solicitudId, fotoUrl }) => {
            try {
                const solicitudData = await pool.query(`
                    SELECT s.*, u.nombre_completo as usuario_nombre 
                    FROM fotografo.solicitudes_foto s 
                    JOIN auth.usuarios u ON s.usuario_id = u.id 
                    WHERE s.id = $1
                `, [solicitudId]);

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
                    'UPDATE fotografo.solicitudes_foto SET estado = "completada" WHERE id = $1',
                    [solicitudId]
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

            } catch (error) {
                console.error('Error guardando foto:', error);
                socket.emit('error-foto', {
                    message: 'Error al guardar la foto'
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('🔴 Cliente desconectado (foto inmediata):', socket.id);
        });
    });
}
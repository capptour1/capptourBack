// src/api/chat/chatController.js
import pool from '../../db.js'; // Usas pool, no db

export const enviarMensaje = async (req, res) => {
    try {
        const { remitente_id, destinatario_id, mensaje } = req.body;

        if (!mensaje) {
            return res.status(400).json({ message: 'El mensaje no puede estar vacío.' });
        }

        await pool.query(
            `INSERT INTO chat.mensajes (remitente_id, destinatario_id, mensaje)
       VALUES ($1, $2, $3)`,
            [remitente_id, destinatario_id, mensaje]
        );

        res.status(201).json({ message: 'Mensaje enviado correctamente.' });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const obtenerHistorial = async (req, res) => {
    try {
        const { usuario1_id, usuario2_id } = req.query;

        if (!usuario1_id || !usuario2_id) {
            return res.status(400).json({ message: 'Faltan parámetros' });
        }

        const result = await pool.query(`
            SELECT remitente_id, destinatario_id, mensaje, fecha
            FROM chat.mensajes
            WHERE (remitente_id = $1 AND destinatario_id = $2)
               OR (remitente_id = $2 AND destinatario_id = $1)
            ORDER BY fecha ASC
        `, [usuario1_id, usuario2_id]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('❌ Error al obtener historial:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const obtenerUsuarioPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
      SELECT id, nombre_completo, email, telefono
      FROM auth.usuarios
      WHERE id = $1
    `, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Error al obtener usuario por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const obtenerUsuariosConConversacion = async (req, res) => {
    try {
        const { fotografo_id } = req.query;

        if (!fotografo_id) {
            return res.status(400).json({ message: 'Falta fotografo_id' });
        }

        const result = await pool.query(`
            SELECT DISTINCT ON (u.id)
                u.id AS usuario_id,
                u.nombre_completo,
                u.telefono,
                m.mensaje AS ultimo_mensaje,
                m.fecha AS timestamp
            FROM chat.mensajes m
            JOIN auth.usuarios u 
                ON (u.id = m.remitente_id AND m.destinatario_id = $1)
                OR (u.id = m.destinatario_id AND m.remitente_id = $1)
            ORDER BY u.id, m.fecha DESC
        `, [fotografo_id]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('❌ Error al obtener usuarios con conversación:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};






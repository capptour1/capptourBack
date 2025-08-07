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
        const { usuario1_id, usuario2_id } = req.body;

        const result = await pool.query(`
      SELECT * FROM chat.mensajes
      WHERE (remitente_id = $1 AND destinatario_id = $2)
         OR (remitente_id = $2 AND destinatario_id = $1)
      ORDER BY fecha ASC
    `, [usuario1_id, usuario2_id]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

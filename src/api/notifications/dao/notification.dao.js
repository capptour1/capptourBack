import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';

/**
 * Crea una notificación en la base de datos y la retorna completa.
 * @param {object} opts
 * @param {number}  opts.userId   - destinatario
 * @param {string}  opts.tipo     - 'message' | 'session' | 'booking' | 'rating' | 'system' | 'promo'
 * @param {string}  opts.titulo
 * @param {string}  opts.mensaje
 * @param {object}  [opts.payload] - datos extra para navegación (JSON)
 * @param {object}  [opts.transaction]
 */
const create = async ({ userId, tipo, titulo, mensaje, payload = null, transaction } = {}) => {
  const [result] = await sequelize.query(
    `INSERT INTO notif.notificaciones (id_usuario, tipo, titulo, mensaje, payload)
     VALUES (:userId, :tipo, :titulo, :mensaje, :payload)
     RETURNING *;`,
    {
      replacements: {
        userId,
        tipo,
        titulo,
        mensaje,
        payload: payload ? JSON.stringify(payload) : null,
      },
      type: QueryTypes.INSERT,
      transaction,
    }
  );
  return result[0];
};

/**
 * Lista las notificaciones de un usuario, más recientes primero.
 * @param {number} userId
 * @param {number} [limit=50]
 * @param {number} [offset=0]
 */
const findByUser = async (userId, limit = 50, offset = 0) => {
  return await sequelize.query(
    `SELECT id, tipo, titulo, mensaje, payload, leida, fec_creacion, fec_lectura
     FROM notif.notificaciones
     WHERE id_usuario = :userId
     ORDER BY fec_creacion DESC
     LIMIT :limit OFFSET :offset;`,
    {
      replacements: { userId, limit, offset },
      type: QueryTypes.SELECT,
    }
  );
};

/**
 * Cuenta las notificaciones no leídas de un usuario.
 */
const countUnread = async (userId) => {
  const [row] = await sequelize.query(
    `SELECT COUNT(*) AS total
     FROM notif.notificaciones
     WHERE id_usuario = :userId AND leida = FALSE;`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    }
  );
  return parseInt(row.total, 10);
};

/**
 * Marca una notificación específica como leída.
 */
const markAsRead = async (notifId, userId) => {
  await sequelize.query(
    `UPDATE notif.notificaciones
     SET leida = TRUE, fec_lectura = NOW()
     WHERE id = :notifId AND id_usuario = :userId;`,
    {
      replacements: { notifId, userId },
      type: QueryTypes.UPDATE,
    }
  );
};

/**
 * Marca TODAS las notificaciones de un usuario como leídas.
 */
const markAllAsRead = async (userId) => {
  await sequelize.query(
    `UPDATE notif.notificaciones
     SET leida = TRUE, fec_lectura = NOW()
     WHERE id_usuario = :userId AND leida = FALSE;`,
    {
      replacements: { userId },
      type: QueryTypes.UPDATE,
    }
  );
};

/**
 * Elimina una notificación (solo si pertenece al usuario).
 */
const remove = async (notifId, userId) => {
  await sequelize.query(
    `DELETE FROM notif.notificaciones
     WHERE id = :notifId AND id_usuario = :userId;`,
    {
      replacements: { notifId, userId },
      type: QueryTypes.DELETE,
    }
  );
};

export default {
  create,
  findByUser,
  countUnread,
  markAsRead,
  markAllAsRead,
  remove,
};

/**
 * membresias.dao.js
 *
 * Acceso a datos para las tres tablas del esquema pagos:
 *   - pagos.membresias
 *   - pagos.transacciones_wompi
 *   - pagos.suscripciones_usuario
 *
 * Usa Sequelize (raw queries) para mantener consistencia con el resto del proyecto.
 */

import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';

// ─── Transacciones ────────────────────────────────────────────────────────────

const start_transaction = () => {
  return sequelize.transaction({ autocommit: false });
};

// ─── pagos.membresias ─────────────────────────────────────────────────────────

/**
 * Obtiene todas las membresías disponibles.
 */
const get_all_membresias = async () => {
  return sequelize.query(
    `SELECT id_membresia, detalle, beneficios, duracion_dias, precio_en_cop
     FROM pagos.membresias
     ORDER BY id_membresia ASC;`,
    { type: QueryTypes.SELECT }
  );
};

/**
 * Obtiene una membresía por su ID.
 * @param {number} id_membresia
 */
const get_membresia_by_id = async (id_membresia) => {
  const result = await sequelize.query(
    `SELECT id_membresia, detalle, beneficios, duracion_dias, precio_en_cop
     FROM pagos.membresias
     WHERE id_membresia = :id_membresia;`,
    {
      replacements: { id_membresia },
      type: QueryTypes.SELECT,
    }
  );
  return result[0] || null;
};

// ─── pagos.transacciones_wompi ────────────────────────────────────────────────

/**
 * Crea un registro de transacción Wompi al iniciar el proceso de pago.
 * @param {object} data
 * @param {number}  data.usuario_id
 * @param {number}  data.membresia_id
 * @param {string}  data.referencia        - referencia única generada por el backend
 * @param {number}  data.monto_en_centavos
 * @param {string}  [data.wompi_transaccion_id]
 * @param {string}  [data.estado]          - estado inicial de Wompi (default: 'PENDING')
 * @param {object}  [data.datos_wompi]     - payload JSON de Wompi
 * @param {object}  [transaction]
 */
const create_transaccion_wompi = async (data, transaction) => {
  const {
    usuario_id,
    membresia_id,
    referencia,
    monto_en_centavos,
    wompi_transaccion_id = null,
    estado = 'PENDING',
    datos_wompi = null,
  } = data;

  const result = await sequelize.query(
    `INSERT INTO pagos.transacciones_wompi
       (usuario_id, membresia_id, referencia, monto_en_centavos,
        wompi_transaccion_id, estado, datos_wompi)
     VALUES
       (:usuario_id, :membresia_id, :referencia, :monto_en_centavos,
        :wompi_transaccion_id, :estado, :datos_wompi)
     RETURNING *;`,
    {
      replacements: {
        usuario_id,
        membresia_id,
        referencia,
        monto_en_centavos,
        wompi_transaccion_id,
        estado,
        datos_wompi: datos_wompi ? JSON.stringify(datos_wompi) : null,
      },
      type: QueryTypes.INSERT,
      transaction,
    }
  );
  return result[0][0];
};

/**
 * Actualiza el estado y los datos de una transacción Wompi.
 * @param {number} id              - PK de pagos.transacciones_wompi
 * @param {string} estado          - nuevo estado (PENDING | APPROVED | DECLINED | VOIDED | ERROR)
 * @param {string} wompi_transaccion_id
 * @param {object} datos_wompi     - payload actualizado de Wompi
 * @param {object} [transaction]
 */
const update_transaccion_wompi = async (id, estado, wompi_transaccion_id, datos_wompi, transaction) => {
  const result = await sequelize.query(
    `UPDATE pagos.transacciones_wompi
     SET estado               = :estado,
         wompi_transaccion_id = :wompi_transaccion_id,
         datos_wompi          = :datos_wompi,
         fecha_actualizacion  = NOW()
     WHERE id = :id
     RETURNING *;`,
    {
      replacements: {
        id,
        estado,
        wompi_transaccion_id,
        datos_wompi: datos_wompi ? JSON.stringify(datos_wompi) : null,
      },
      type: QueryTypes.UPDATE,
      transaction,
    }
  );
  return result[0][0];
};

/**
 * Busca una transacción Wompi por su referencia única.
 * @param {string} referencia
 */
const get_transaccion_by_referencia = async (referencia) => {
  const result = await sequelize.query(
    `SELECT * FROM pagos.transacciones_wompi
     WHERE referencia = :referencia
     LIMIT 1;`,
    {
      replacements: { referencia },
      type: QueryTypes.SELECT,
    }
  );
  return result[0] || null;
};

/**
 * Busca una transacción Wompi por su ID de transacción de Wompi.
 * @param {string} wompi_transaccion_id
 */
const get_transaccion_by_wompi_id = async (wompi_transaccion_id) => {
  const result = await sequelize.query(
    `SELECT * FROM pagos.transacciones_wompi
     WHERE wompi_transaccion_id = :wompi_transaccion_id
     LIMIT 1;`,
    {
      replacements: { wompi_transaccion_id },
      type: QueryTypes.SELECT,
    }
  );
  return result[0] || null;
};

// ─── pagos.suscripciones_usuario ──────────────────────────────────────────────

/**
 * Crea o actualiza la suscripción del usuario (upsert).
 *
 * La tabla tiene UNIQUE(usuario_id): un usuario solo puede tener una fila.
 * Si ya existe una suscripción para ese usuario, se reemplaza con los nuevos
 * datos de membresía y transacción, volviendo al estado 'pending' para que
 * el nuevo pago pueda ser aprobado por el webhook.
 *
 * @param {object} data
 * @param {number}  data.usuario_id
 * @param {number}  data.membresia_id
 * @param {number}  data.transaccion_id  - FK a pagos.transacciones_wompi
 * @param {object}  [transaction]
 */
const create_suscripcion = async (data, transaction) => {
  const { usuario_id, membresia_id, transaccion_id } = data;

  const result = await sequelize.query(
    `INSERT INTO pagos.suscripciones_usuario
       (usuario_id, membresia_id, transaccion_id, estado, fecha_inicio, fecha_fin)
     VALUES
       (:usuario_id, :membresia_id, :transaccion_id, 'pending', NOW(), NOW())
     ON CONFLICT (usuario_id) DO UPDATE
       SET membresia_id        = EXCLUDED.membresia_id,
           transaccion_id      = EXCLUDED.transaccion_id,
           estado              = 'pending',
           fecha_inicio        = NOW(),
           fecha_fin           = NOW(),
           fecha_actualizacion = NOW()
     RETURNING *;`,
    {
      replacements: { usuario_id, membresia_id, transaccion_id },
      type: QueryTypes.INSERT,
      transaction,
    }
  );
  return result[0][0];
};

/**
 * Activa una suscripción: la pasa a 'approved' y registra las fechas de inicio y fin.
 * La fecha de fin se calcula como fecha_inicio + duracion_dias de la membresía.
 * @param {number} id              - PK de pagos.suscripciones_usuario
 * @param {object} [transaction]
 */
const activate_suscripcion = async (id, transaction) => {
  const result = await sequelize.query(
    `UPDATE pagos.suscripciones_usuario su
     SET estado              = 'approved',
         fecha_inicio        = NOW(),
         fecha_fin           = NOW() + (
           SELECT duracion_dias FROM pagos.membresias
           WHERE id_membresia = su.membresia_id
         ) * INTERVAL '1 day',
         fecha_actualizacion = NOW()
     WHERE su.id = :id
     RETURNING *;`,
    {
      replacements: { id },
      type: QueryTypes.UPDATE,
      transaction,
    }
  );
  return result[0][0];
};

/**
 * Cancela una suscripción.
 * @param {number} id
 * @param {object} [transaction]
 */
const cancel_suscripcion = async (id, transaction) => {
  const result = await sequelize.query(
    `UPDATE pagos.suscripciones_usuario
     SET estado              = 'cancel',
         fecha_actualizacion = NOW()
     WHERE id = :id
     RETURNING *;`,
    {
      replacements: { id },
      type: QueryTypes.UPDATE,
      transaction,
    }
  );
  return result[0][0];
};

/**
 * Consulta el estado completo de membresía de un usuario.
 * Trae la suscripción más reciente (no cancelada preferida), su membresía y transacción.
 *
 * La vigencia no se filtra aquí — se valida en el service para mantener
 * la lógica de negocio separada del acceso a datos.
 *
 * @param {number} usuario_id
 */
const get_estado_membresia_usuario = async (usuario_id) => {
  const result = await sequelize.query(
    `SELECT
       su.id                    AS suscripcion_id,
       su.usuario_id,
       su.estado                AS estado_suscripcion,
       su.fecha_inicio,
       su.fecha_fin,
       su.fecha_creacion        AS suscripcion_creada_en,

       m.id_membresia,
       m.detalle                AS membresia_nombre,
       m.beneficios,
       m.duracion_dias,
       m.precio_en_cop,

       tw.id                    AS transaccion_id,
       tw.referencia            AS transaccion_referencia,
       tw.wompi_transaccion_id,
       tw.estado                AS estado_transaccion_wompi,
       tw.monto_en_centavos,
       tw.datos_wompi,
       tw.fecha_creacion        AS transaccion_creada_en

     FROM pagos.suscripciones_usuario su
     INNER JOIN pagos.membresias m
       ON m.id_membresia = su.membresia_id
     LEFT JOIN pagos.transacciones_wompi tw
       ON tw.id = su.transaccion_id

     WHERE su.usuario_id = :usuario_id

     ORDER BY
       -- priorizar aprobadas vigentes, luego pendientes, luego las más recientes
       CASE su.estado
         WHEN 'approved' THEN 1
         WHEN 'pending'  THEN 2
         WHEN 'cancel'   THEN 3
         ELSE 4
       END ASC,
       su.fecha_creacion DESC

     LIMIT 1;`,
    {
      replacements: { usuario_id },
      type: QueryTypes.SELECT,
    }
  );
  return result[0] || null;
};

/**
 * Obtiene el historial de pagos del usuario consultando directamente
 * pagos.transacciones_wompi, ya que la tabla suscripciones_usuario
 * solo conserva la suscripción más reciente (UNIQUE usuario_id).
 * @param {number} usuario_id
 */
const get_historial_suscripciones = async (usuario_id) => {
  return sequelize.query(
    `SELECT
       tw.id                    AS transaccion_id,
       tw.referencia            AS transaccion_referencia,
       tw.wompi_transaccion_id,
       tw.estado                AS estado_transaccion_wompi,
       tw.monto_en_centavos,
       tw.fecha_creacion        AS transaccion_creada_en,

       m.id_membresia,
       m.detalle                AS membresia_nombre,
       m.duracion_dias,
       m.precio_en_cop,

       su.id                    AS suscripcion_id,
       su.estado                AS estado_suscripcion,
       su.fecha_inicio,
       su.fecha_fin

     FROM pagos.transacciones_wompi tw
     INNER JOIN pagos.membresias m
       ON m.id_membresia = tw.membresia_id
     LEFT JOIN pagos.suscripciones_usuario su
       ON su.transaccion_id = tw.id

     WHERE tw.usuario_id = :usuario_id
     ORDER BY tw.fecha_creacion DESC;`,
    {
      replacements: { usuario_id },
      type: QueryTypes.SELECT,
    }
  );
};

export default {
  start_transaction,
  // membresias
  get_all_membresias,
  get_membresia_by_id,
  // transacciones wompi
  create_transaccion_wompi,
  update_transaccion_wompi,
  get_transaccion_by_referencia,
  get_transaccion_by_wompi_id,
  // suscripciones usuario
  create_suscripcion,
  activate_suscripcion,
  cancel_suscripcion,
  get_estado_membresia_usuario,
  get_historial_suscripciones,
};

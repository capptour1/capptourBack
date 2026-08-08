/**
 * membresias.service.js
 *
 * Lógica de negocio para membresías, suscripciones y pagos Wompi.
 *
 * ─── NOTA SOBRE CRÉDITOS ─────────────────────────────────────────────────────
 * La tabla pagos.membresias NO tiene una columna numérica estructurada para
 * créditos. Tiene la columna `beneficios` (tipo text). Este servicio intenta
 * parsear `beneficios` como JSON y extraer la propiedad `creditos` si existe.
 * Ejemplo de valor esperado en `beneficios`:
 *   '{"creditos": 10, "descripcion": "Plan básico"}'
 *
 * Si el proyecto no usa ese formato, los campos `creditos_otorgados` y
 * `creditos_disponibles` retornarán null. Para implementar créditos consumidos
 * se necesitaría una tabla adicional (ej: pagos.consumo_creditos) que aún no
 * existe en el esquema actual.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ─── ESTADOS WOMPI ───────────────────────────────────────────────────────────
 * Los estados de la API de Wompi son: PENDING | APPROVED | DECLINED | VOIDED | ERROR
 * Estos son DISTINTOS de los estados de suscripcion: pending | approved | cancel
 * ─────────────────────────────────────────────────────────────────────────────
 */

import membresiaDao from '../dao/membresias.dao.js';
import AppError from '../../../utils/appError.js';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import crypto from 'crypto';

// ─── Constantes de estados ────────────────────────────────────────────────────

/** Estados válidos de pagos.suscripciones_usuario */
const ESTADO_SUSCRIPCION = {
  PENDING:  'pending',
  APPROVED: 'approved',
  CANCEL:   'cancel',
};

/** Estados de transacción que devuelve la API de Wompi */
const ESTADO_WOMPI = {
  PENDING:  'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  VOIDED:   'VOIDED',
  ERROR:    'ERROR',
};

// ─── Helper: parsear créditos desde campo beneficios ──────────────────────────

/**
 * Intenta extraer la cantidad de créditos desde el campo `beneficios` de la membresía.
 * Si `beneficios` es un JSON con la propiedad `creditos`, la retorna.
 * En caso contrario retorna null (no inventamos datos que no existen).
 * @param {string|null} beneficios
 * @returns {number|null}
 */
const parse_creditos = (beneficios) => {
  if (!beneficios) return null;
  try {
    const parsed = typeof beneficios === 'string' ? JSON.parse(beneficios) : beneficios;
    if (parsed && typeof parsed.creditos === 'number') {
      return parsed.creditos;
    }
    return null;
  } catch {
    return null;
  }
};

// ─── Helper: query helper con transacción ─────────────────────────────────────

/**
 * Helper interno para ejecutar queries SELECT dentro de una transacción opcional.
 */
const sequelizeQuery = async (sql, replacements, transaction) => {
  return sequelize.query(sql, {
    replacements,
    type: QueryTypes.SELECT,
    transaction,
  });
};

// ─── Helper: determinar vigencia ──────────────────────────────────────────────

/**
 * Determina si una suscripción está vigente aplicando todas las reglas de negocio.
 *
 * Una suscripción NO está vigente si:
 *  1. Está en estado 'cancel'
 *  2. El pago Wompi NO está en estado 'APPROVED'
 *  3. La fecha actual supera la fecha_fin calculada
 *  4. No tiene fecha_inicio registrada
 *
 * @param {object} row  - fila combinada de get_estado_membresia_usuario
 * @returns {{ vigente: boolean, razon: string|null }}
 */
const evaluar_vigencia = (row) => {
  if (!row) {
    return { vigente: false, razon: 'sin_suscripcion' };
  }

  if (row.estado_suscripcion === ESTADO_SUSCRIPCION.CANCEL) {
    return { vigente: false, razon: 'suscripcion_cancelada' };
  }

  if (row.estado_suscripcion === ESTADO_SUSCRIPCION.PENDING) {
    return { vigente: false, razon: 'pago_pendiente' };
  }

  if (row.estado_transaccion_wompi !== ESTADO_WOMPI.APPROVED) {
    return { vigente: false, razon: 'pago_no_aprobado' };
  }

  if (!row.fecha_inicio) {
    return { vigente: false, razon: 'sin_fecha_inicio' };
  }

  const ahora = new Date();
  const fechaFin = row.fecha_fin ? new Date(row.fecha_fin) : null;

  if (!fechaFin) {
    return { vigente: false, razon: 'sin_fecha_fin' };
  }

  if (ahora > fechaFin) {
    return { vigente: false, razon: 'membresia_vencida' };
  }

  return { vigente: true, razon: null };
};

// ─── Servicio principal: estado de membresía ──────────────────────────────────

/**
 * Dado un user_id, retorna el estado completo de su membresía y créditos disponibles.
 * Este es el método principal que debe llamarse al login / ingreso a la plataforma.
 *
 * @param {number} usuario_id
 * @returns {object} Estado completo de la membresía
 */
const get_estado_membresia = async (usuario_id) => {
  const row = await membresiaDao.get_estado_membresia_usuario(usuario_id);

  // Usuario sin suscripción registrada
  if (!row) {
    return {
      tiene_suscripcion:     false,
      membresia_vigente:     false,
      razon_no_vigente:      'sin_suscripcion',
      suscripcion:           null,
      membresia:             null,
      transaccion_wompi:     null,
      creditos_otorgados:    null,
      creditos_disponibles:  null,
      puede_usar_creditos:   false,
    };
  }

  const { vigente, razon } = evaluar_vigencia(row);
  const creditos_otorgados = parse_creditos(row.beneficios);

  // NOTA: los créditos consumidos no existen como dato estructurado en el
  // esquema actual. Se retorna null hasta que se implemente pagos.consumo_creditos.
  const creditos_consumidos = null;
  const creditos_disponibles =
    creditos_otorgados !== null && creditos_consumidos !== null
      ? Math.max(0, creditos_otorgados - creditos_consumidos)
      : creditos_otorgados !== null
        ? creditos_otorgados  // sin consumo registrado → todos disponibles
        : null;

  return {
    tiene_suscripcion:    true,
    membresia_vigente:    vigente,
    razon_no_vigente:     vigente ? null : razon,

    suscripcion: {
      id:              row.suscripcion_id,
      estado:          row.estado_suscripcion,
      fecha_inicio:    row.fecha_inicio,
      fecha_fin:       row.fecha_fin,
      creada_en:       row.suscripcion_creada_en,
    },

    membresia: {
      id:            row.id_membresia,
      nombre:        row.membresia_nombre,
      beneficios:    row.beneficios,
      duracion_dias: row.duracion_dias,
      precio_en_cop: row.precio_en_cop,
    },

    transaccion_wompi: {
      id:                   row.transaccion_id,
      referencia:           row.transaccion_referencia,
      wompi_transaccion_id: row.wompi_transaccion_id,
      estado:               row.estado_transaccion_wompi,
      monto_en_centavos:    row.monto_en_centavos,
      creada_en:            row.transaccion_creada_en,
    },

    creditos_otorgados,
    creditos_consumidos,   // null hasta implementar consumo_creditos
    creditos_disponibles,
    puede_usar_creditos: vigente && creditos_disponibles !== null && creditos_disponibles > 0,
  };
};

// ─── Servicio: obtener membresías disponibles ─────────────────────────────────

const get_membresias_disponibles = async () => {
  const rows = await membresiaDao.get_all_membresias();
  return rows.map((m) => ({
    id:            m.id_membresia,
    nombre:        m.detalle,
    beneficios:    m.beneficios,
    duracion_dias: m.duracion_dias,
    precio_en_cop: m.precio_en_cop,
    creditos:      parse_creditos(m.beneficios),
  }));
};

// ─── Helper: firma de integridad para Wompi ───────────────────────────────────

/**
 * Genera la firma de integridad SHA256 que requiere el widget de Wompi.
 * Fórmula: SHA256( referencia + monto_en_centavos + "COP" + integrity_secret )
 *
 * Esta firma se calcula en el backend para no exponer el integrity secret
 * al frontend.
 *
 * @param {string} referencia
 * @param {number} monto_en_centavos
 * @returns {string} hash SHA256 en hexadecimal
 */
const generar_firma_integridad = (referencia, monto_en_centavos) => {
  const integritySecret = process.env.WOMPI_INTEGRITY_KEY;
  if (!integritySecret) {
    throw new AppError('Wompi no configurado: falta WOMPI_INTEGRITY_KEY', 500);
  }
  // Orden exacto que exige Wompi: referencia + monto + moneda + secret
  const cadena = `${referencia}${monto_en_centavos}COP${integritySecret}`;
  return crypto.createHash('sha256').update(cadena).digest('hex');
};

// ─── Helper: validar checksum del webhook ─────────────────────────────────────

/**
 * Valida que el webhook realmente proviene de Wompi usando SHA256.
 *
 * Algoritmo oficial de Wompi:
 *  1. Concatenar los valores de los campos indicados en signature.properties
 *     (apuntan a campos dentro de data)
 *  2. Concatenar el timestamp del evento
 *  3. Concatenar el WOMPI_EVENTS_KEY
 *  4. SHA256 del resultado → debe coincidir con signature.checksum
 *
 * Si WOMPI_EVENTS_KEY no está configurado, se omite la validación (útil en desarrollo).
 *
 * @param {object} payload - body completo del webhook
 * @returns {boolean}
 */
const validar_checksum_webhook = (payload) => {
  const eventsSecret = process.env.WOMPI_EVENTS_KEY;
  if (!eventsSecret) {
    // Sin clave configurada no podemos validar → permitir en desarrollo, loguear advertencia
    console.warn('[WOMPI] WOMPI_EVENTS_KEY no configurado. Saltando validación de checksum.');
    return true;
  }

  const { signature, data, timestamp } = payload;
  if (!signature?.checksum || !signature?.properties || !timestamp) {
    return false;
  }

  // Extraer los valores en el orden que indica properties
  const valoresConcatenados = signature.properties
    .map((prop) => {
      // Las propiedades son rutas como "transaction.id", "transaction.status"
      const partes = prop.split('.');
      let valor = data;
      for (const parte of partes) {
        valor = valor?.[parte];
      }
      return valor ?? '';
    })
    .join('');

  const cadena = `${valoresConcatenados}${timestamp}${eventsSecret}`;
  const checksumCalculado = crypto.createHash('sha256').update(cadena).digest('hex');

  return checksumCalculado.toUpperCase() === signature.checksum.toUpperCase();
};

// ─── Servicio: iniciar proceso de pago con Wompi ─────────────────────────────

/**
 * Inicia el proceso de pago:
 *  1. Valida que la membresía exista
 *  2. Genera referencia única y firma de integridad SHA256
 *  3. Crea una transacción en estado PENDING
 *  4. Crea una suscripción en estado 'pending'
 *  5. Retorna todo lo que el frontend necesita para abrir el widget de Wompi
 *
 * El frontend usa wompi_config directamente en el widget/checkout web.
 * El pago real lo procesa Wompi; el resultado llega al backend vía webhook.
 *
 * @param {number} usuario_id
 * @param {number} membresia_id
 */
const iniciar_pago = async (usuario_id, membresia_id) => {
  const membresia = await membresiaDao.get_membresia_by_id(membresia_id);
  if (!membresia) {
    throw new AppError('Membresía no encontrada', 404);
  }

  // precio_en_cop es varchar — puede venir como "15.000", "15,000" o "15000"
  const precio_limpio = String(membresia.precio_en_cop).replace(/[^0-9]/g, '');
  const monto_en_centavos = parseInt(precio_limpio, 10) * 100;

  if (isNaN(monto_en_centavos) || monto_en_centavos <= 0) {
    throw new AppError('El precio de la membresía no es válido', 422);
  }

  // Referencia única — Wompi no permite reusar referencias
  const referencia = `MEMB-${usuario_id}-${membresia_id}-${uuidv4().slice(0, 8).toUpperCase()}`;

  // Firma calculada en el backend para no exponer WOMPI_INTEGRITY_KEY al frontend
  const firma_integridad = generar_firma_integridad(referencia, monto_en_centavos);

  let t;
  try {
    t = await membresiaDao.start_transaction();

    const transaccion = await membresiaDao.create_transaccion_wompi(
      { usuario_id, membresia_id, referencia, monto_en_centavos },
      t
    );

    const suscripcion = await membresiaDao.create_suscripcion(
      { usuario_id, membresia_id, transaccion_id: transaccion.id },
      t
    );

    await t.commit();

    return {
      referencia,
      suscripcion_id:    suscripcion.id,
      transaccion_id:    transaccion.id,
      monto_en_centavos,
      membresia: {
        id:            membresia.id_membresia,
        nombre:        membresia.detalle,
        duracion_dias: membresia.duracion_dias,
      },
      // Todo lo que el frontend necesita para abrir el widget de Wompi
      wompi_config: {
        public_key:          process.env.WOMPI_PUBLIC_KEY || '',
        currency:            'COP',
        amount_in_cents:     monto_en_centavos,
        reference:           referencia,
        signature_integrity: firma_integridad,
        redirect_url:        process.env.WOMPI_REDIRECT_URL || '',
      },
    };
  } catch (err) {
    if (t) await t.rollback();
    throw err;
  }
};

// ─── Servicio: webhook de Wompi ───────────────────────────────────────────────

/**
 * Procesa el webhook que envía Wompi cuando una transacción cambia de estado.
 *
 * Wompi envía un POST con esta estructura:
 * {
 *   event: "transaction.updated",
 *   data: { transaction: { id, reference, status, amount_in_cents, ... } },
 *   timestamp: 1530291411,
 *   signature: { checksum: "...", properties: ["transaction.id", "transaction.status", ...] }
 * }
 *
 * Estados Wompi: PENDING | APPROVED | DECLINED | VOIDED | ERROR
 * Si APPROVED  → activa la suscripción (fecha_inicio y fecha_fin calculadas automáticamente)
 * Si DECLINED, VOIDED o ERROR → cancela la suscripción
 *
 * @param {object} payload - body completo del webhook de Wompi
 */
const procesar_webhook_wompi = async (payload) => {
  // 1. Validar autenticidad del webhook con SHA256
  const checksumValido = validar_checksum_webhook(payload);
  if (!checksumValido) {
    throw new AppError('Webhook inválido: checksum no coincide', 401);
  }

  const { event, data } = payload || {};

  if (event !== 'transaction.updated') {
    return { procesado: false, razon: 'evento_ignorado' };
  }

  const transaccionWompi = data?.transaction;
  if (!transaccionWompi?.reference) {
    throw new AppError('Payload de webhook inválido: falta referencia', 400);
  }

  const { reference, status, id: wompi_id } = transaccionWompi;

  // 2. Buscar la transacción local por referencia
  const transaccionLocal = await membresiaDao.get_transaccion_by_referencia(reference);
  if (!transaccionLocal) {
    // Puede ser una transacción de otro sistema; responder 200 para que Wompi no reintente
    console.warn(`[WOMPI] Referencia no encontrada en BD: ${reference}`);
    return { procesado: false, razon: 'referencia_no_encontrada' };
  }

  let t;
  try {
    t = await membresiaDao.start_transaction();

    // 3. Actualizar la transacción Wompi con el estado y datos completos
    await membresiaDao.update_transaccion_wompi(
      transaccionLocal.id,
      status,
      wompi_id,
      transaccionWompi,
      t
    );

    // 4. Buscar la suscripción asociada
    const [suscripcion] = await sequelizeQuery(
      `SELECT id, estado FROM pagos.suscripciones_usuario
       WHERE transaccion_id = :transaccion_id
       LIMIT 1;`,
      { transaccion_id: transaccionLocal.id },
      t
    );

    if (!suscripcion) {
      await t.rollback();
      return { procesado: false, razon: 'suscripcion_no_encontrada' };
    }

    // 5. Actualizar estado de la suscripción según el resultado del pago
    if (status === ESTADO_WOMPI.APPROVED) {
      // activate_suscripcion pone estado='approved', registra fecha_inicio=NOW()
      // y calcula fecha_fin = NOW() + duracion_dias de la membresía
      if (suscripcion.estado === ESTADO_SUSCRIPCION.PENDING) {
        await membresiaDao.activate_suscripcion(suscripcion.id, t);
      }
    } else if ([ESTADO_WOMPI.DECLINED, ESTADO_WOMPI.VOIDED, ESTADO_WOMPI.ERROR].includes(status)) {
      if (suscripcion.estado !== ESTADO_SUSCRIPCION.CANCEL) {
        await membresiaDao.cancel_suscripcion(suscripcion.id, t);
      }
    }
    // PENDING → no cambia el estado de la suscripción, se espera el evento final

    await t.commit();
    return { procesado: true, estado_wompi: status };
  } catch (err) {
    if (t) await t.rollback();
    throw err;
  }
};

// ─── Servicio: consultar estado de transacción en Wompi ───────────────────────

/**
 * Consulta el estado de una transacción directamente en la API de Wompi.
 * Útil cuando el webhook no llega o para verificación manual.
 *
 * @param {string} wompi_transaccion_id
 */
const consultar_transaccion_wompi = async (wompi_transaccion_id) => {
  const apiKey = process.env.WOMPI_PRIVATE_KEY;
  if (!apiKey) {
    throw new AppError('Wompi no configurado: falta WOMPI_PRIVATE_KEY', 500);
  }

  const response = await fetch(
    `https://production.wompi.co/v1/transactions/${wompi_transaccion_id}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(`Error consultando Wompi: ${response.status} ${errorBody}`, 502);
  }

  return response.json();
};

// ─── Servicio: historial de suscripciones ────────────────────────────────────

const get_historial_suscripciones = async (usuario_id) => {
  return membresiaDao.get_historial_suscripciones(usuario_id);
};

// ─── Servicio: cancelar suscripción manualmente ───────────────────────────────

const cancelar_suscripcion = async (suscripcion_id, usuario_id) => {
  // Verificar que la suscripción pertenece al usuario
  const [suscripcion] = await sequelizeQuery(
    `SELECT id, usuario_id, estado FROM pagos.suscripciones_usuario
     WHERE id = :suscripcion_id AND usuario_id = :usuario_id
     LIMIT 1;`,
    { suscripcion_id, usuario_id }
  );

  if (!suscripcion) {
    throw new AppError('Suscripción no encontrada', 404);
  }

  if (suscripcion.estado === ESTADO_SUSCRIPCION.CANCEL) {
    throw new AppError('La suscripción ya está cancelada', 400);
  }

  return membresiaDao.cancel_suscripcion(suscripcion_id);
};

export default {
  get_estado_membresia,
  get_membresias_disponibles,
  iniciar_pago,
  procesar_webhook_wompi,
  consultar_transaccion_wompi,
  get_historial_suscripciones,
  cancelar_suscripcion,
};

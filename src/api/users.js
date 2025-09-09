// routes/auth.js
import express from 'express';
import pool from '../db.js';
import multer from 'multer';
import nodemailer from 'nodemailer';

const router = express.Router();

/* =========================
   CONFIG: Multer (PDF en memoria)
========================= */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Formato de archivo no permitido (solo PDF).'));
  }
});

/* =========================
   CONFIG: Nodemailer (SMTP)
   Usa variables de entorno (NO hardcodear claves)
========================= */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_SECURE || 'false') === 'true', // true para 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// (opcional) verifica conexión SMTP al iniciar
transporter.verify().then(() => {
  console.log('[mail] SMTP listo');
}).catch(err => {
  console.warn('[mail] SMTP no verificado:', err?.message);
});

/* Helper para enviar correo */
async function sendVerificationEmail({ to, codigo, brand = 'Nubi' }) {
  const from = process.env.EMAIL_FROM || `Soporte ${brand} <${process.env.EMAIL_USER}>`;
  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Código de verificación',
    html: `
      <h2>¡Bienvenido a ${brand}!</h2>
      <p>Tu código de verificación es:</p>
      <h1 style="letter-spacing:3px">${codigo}</h1>
      <p>Si no fuiste tú, ignora este mensaje.</p>
    `
  });
  return info; // info.messageId
}

/* =========================
   POST /verify
   Verifica código y marca usuario como verificado
========================= */
router.post('/verify', async (req, res) => {
  const { email, codigo } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({ error: 'Faltan datos: email y código' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, codigo_verificacion, verificado
       FROM auth.usuarios
       WHERE email = $1`,
      [email]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const u = rows[0];

    if (u.verificado) return res.status(200).json({ message: 'Usuario ya verificado' });

    if (!u.codigo_verificacion || u.codigo_verificacion !== codigo) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    await pool.query(
      `UPDATE auth.usuarios
       SET verificado = true, codigo_verificacion = NULL
       WHERE email = $1`,
      [email]
    );

    return res.json({ message: 'Usuario verificado correctamente' });
  } catch (err) {
    console.error('Error al verificar código:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* =========================
   POST /
   Registro normal (sin archivo) + envío de código
   NOTA: hashea password en producción (bcrypt)
========================= */
router.post('/', async (req, res) => {
  const { nombre, email, password, rol_id, telefono, servicio_id } = req.body;

  if (!nombre || !email || !password || !rol_id || !telefono || !servicio_id) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    const insertQuery = `
      INSERT INTO auth.usuarios
      (nombre_completo, email, password, rol_id, telefono, servicio_id, creado_en, estado, verificado, codigo_verificacion)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'A', false, $7)
      RETURNING *;
    `;

    const values = [nombre, email, password, rol_id, telefono, servicio_id ?? null, codigo];
    const result = await pool.query(insertQuery, values);

    await sendVerificationEmail({ to: email, codigo, brand: 'Capptour' });

    return res.status(201).json({
      message: 'Usuario registrado. Código enviado al correo.',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* =========================
   POST /resend-code
   Reenvía un nuevo código
========================= */
router.post('/resend-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Falta el email' });

  try {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    const { rowCount } = await pool.query(
      `UPDATE auth.usuarios
       SET codigo_verificacion = $1, verificado = false
       WHERE email = $2`,
      [codigo, email]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    await sendVerificationEmail({ to: email, codigo, brand: 'Nubi' });

    return res.json({ message: 'Nuevo código enviado' });
  } catch (err) {
    console.error('Error en resend-code:', err);
    return res.status(500).json({ error: 'Error interno al reenviar código' });
  }
});

/* =========================
   POST /register/fotografo
   Registro con archivo (PDF) + envío de código
========================= */
router.post('/register/fotografo', upload.single('hoja_vida'), async (req, res) => {
  const client = await pool.connect();

  try {
    const { nombre, email, password, rol_id, telefono, descripcion, tarifas } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No se adjuntó hoja de vida (PDF)' });

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    await client.query('BEGIN');

    // 1) Usuario
    const userResult = await client.query(
      `INSERT INTO auth.usuarios
       (nombre_completo, email, password, rol_id, telefono, creado_en, estado, verificado, codigo_verificacion)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'A', false, $6)
       RETURNING id, email`,
      [nombre, email, password, rol_id, telefono, codigo]
    );

    const usuario_id = userResult.rows[0].id;

    // 2) Fotógrafo (guardas nombre del archivo; si usas storage, aquí subirías y guardarías la URL)
    await client.query(
      `INSERT INTO fotografo.fotografos (usuario_id, hoja_vida, descripcion, tarifas)
       VALUES ($1, $2, $3, $4)`,
      [usuario_id, req.file.originalname, descripcion || null, tarifas || null]
    );

    await client.query('COMMIT');

    await sendVerificationEmail({ to: email, codigo, brand: 'Nubi' });

    return res.status(201).json({ message: 'Fotógrafo registrado. Código enviado al correo' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en registro de fotógrafo:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

/* =========================
   POST /info
   Trae info de usuario + datos de fotógrafo si existen
========================= */
router.post('/info', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Falta el ID del usuario' });

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre_completo, u.email, u.telefono, u.rol_id,
              f.descripcion, f.tarifas, f.hoja_vida
       FROM auth.usuarios u
       LEFT JOIN fotografo.fotografos f ON u.id = f.usuario_id
       WHERE u.id = $1`,
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/* =========================
   Manejo de errores de multer
========================= */
router.use((err, req, res, next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'El archivo supera el límite de 10 MB' });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

export default router;

import express from 'express';
import pool from '../db.js';
import multer from 'multer';
import fs from 'fs/promises';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router = express.Router();

// Configuración de almacenamiento en memoria
const storage = multer.memoryStorage();

// Configuración de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "gabodelac@gmail.com",
    pass:"ezfq hdcc wnyg rcol"
  }
});

// Configurar multer con validaciones
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    console.log('Archivo recibido:', file.originalname);
    console.log('Tipo de archivo:', file.mimetype);

    const allowedTypes = ['application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no permitido (solo PDF).'));
    }
  },
});

// --- Ruta de registro normal (sin archivo) ---
router.post('/', async (req, res) => {
  const { nombre, email, password, rol_id, telefono, servicio_id } = req.body;

  if (!nombre || !email || !password || !rol_id || !telefono || !servicio_id) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    // Generar código de verificación de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    const insertQuery = `
      INSERT INTO auth.usuarios 
      (nombre_completo, email, password, rol_id, telefono, servicio_id, creado_en, verificado, codigo_verificacion)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), false, $7) 
      RETURNING *;
    `;

    const values = [nombre, email, password, rol_id, telefono, servicio_id ?? null, codigo];
    const result = await pool.query(insertQuery, values);

    // Enviar el correo
    await transporter.sendMail({
      from: `"Soporte Nubi" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de verificación',
      html: `
        <h2>¡Bienvenido a Nubi!</h2>
        <p>Tu código de verificación es:</p>
        <h1>${codigo}</h1>
        <p>Este código expira en 15 minutos.</p>
      `
    });

    res.status(201).json({
      message: 'Usuario registrado. Código enviado al correo.',
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- Ruta de registro con archivo para fotógrafos ---
router.post('/register/fotografo', upload.single('hoja_vida'), async (req, res) => {
  const client = await pool.connect();

  try {
    const { nombre, email, password, rol_id, telefono, descripcion, tarifas } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No se adjuntó hoja de vida' });
    }

    // Iniciar transacción
    await client.query('BEGIN');

    // Generar código
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Insertar en auth.usuarios
    const userResult = await client.query(
      `INSERT INTO auth.usuarios 
       (nombre_completo, email, password, rol_id, telefono, creado_en, verificado, codigo_verificacion)
       VALUES ($1, $2, $3, $4, $5, NOW(), false, $6) 
       RETURNING id, email`,
      [nombre, email, password, rol_id, telefono, codigo]
    );
    const usuario_id = userResult.rows[0].id;

    // 2. Insertar en fotografo.fotografos
    await client.query(
      `INSERT INTO fotografo.fotografos (usuario_id, hoja_vida, descripcion, tarifas)
       VALUES ($1, $2, $3, $4)`,
      [usuario_id, req.file.originalname, descripcion, tarifas]
    );

    // Confirmar transacción
    await client.query('COMMIT');

    // Enviar correo con código
    await transporter.sendMail({
      from: `"Soporte Nubi" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de verificación',
      html: `
        <h2>¡Bienvenido a Nubi!</h2>
        <p>Tu código de verificación es:</p>
        <h1>${codigo}</h1>
        <p>Este código expira en 15 minutos.</p>
      `
    });

    res.status(201).json({ message: 'Fotógrafo registrado. Código enviado al correo' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en registro de fotógrafo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

// --- Ruta para obtener información de un usuario ---
router.post('/info', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Falta el ID del usuario' });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre_completo, u.email, u.telefono, u.rol_id,
              f.descripcion, f.tarifas, f.hoja_vida
       FROM auth.usuarios u
       LEFT JOIN fotografo.fotografos f ON u.id = f.usuario_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Middleware de manejo de errores de multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'El archivo supera el límite de 10 MB' });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default router;

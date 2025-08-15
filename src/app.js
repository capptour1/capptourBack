import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import pool from './db.js';

const app = express();

// Necesario para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middlewares modernos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📂 Crear carpeta uploads/comprobantes si no existe
const uploadsDir = path.join(__dirname, '../uploads');
const comprobantesDir = path.join(uploadsDir, 'comprobantes');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('📁 Carpeta "uploads" creada.');
}

if (!fs.existsSync(comprobantesDir)) {
  fs.mkdirSync(comprobantesDir);
  console.log('📁 Carpeta "uploads/comprobantes" creada.');
}

// Conexión a la base de datos
pool.connect()
  .then(client => {
    console.log('✅ Conexión a la base de datos exitosa');
    client.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos', err);
  });

// 👉 Servir archivos estáticos (incluyendo comprobantes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 👉 Tus rutas API generales
app.use('/api', routes);

// ❌ Ya no escuchamos aquí. El `socketServer.js` lo hará.
export default app;

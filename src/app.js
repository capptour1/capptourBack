import express from 'express';
import path from 'path';
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

// Conexión a la base de datos
pool.connect()
  .then(client => {
    console.log('Conexión a la base de datos exitosa');
    client.release();
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos', err);
  });

// 👉 Carpeta pública para servir las fotos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 👉 Tus rutas API generales
app.use('/api', routes);

// ❌ Ya no escuchamos aquí. El `socketServer.js` lo hará.
export default app;

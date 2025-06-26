import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Necesario para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

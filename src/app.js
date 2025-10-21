import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { sequelize } from './models/index.js';
import jwt from 'jsonwebtoken'; 

const app = express();

// Necesario para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middlewares modernos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// // ✅ MIDDLEWARE DE AUTENTICACIÓN JWT (FALTABA ESTO)
// app.use((req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   console.log('Auth Header:', authHeader);
//   const token = authHeader && authHeader.split(' ')[1];

//   if (token) {
//     jwt.verify(token, 'secret_key', (err, user) => {
//       if (!err) {
//         req.user = user; // ✅ Inyectar usuario en la request
//       }
//       next();
//     });
//   } else {
//     next();
//   }
// });

// initilize conection sequelize


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

// Conexión a la base de datos con Sequelize
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión a la base de datos exitosa con Sequelize');
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos', err);
  });

// 👉 Servir archivos estáticos (incluyendo comprobantes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 👉 Tus rutas API generales
app.use('/api', routes);

// error 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint no encontrado' });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});





// ❌ Ya no escuchamos aquí. El `socketServer.js` lo hará.
export default app;
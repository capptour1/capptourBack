import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';

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
app.use((req, res, next) => {

    const inicio = Date.now();

    res.on('finish', () => {

        const tiempo = Date.now() - inicio;

        console.log(
            `${req.method} ${req.originalUrl} ${res.statusCode} ${tiempo}ms`
        );

    });

    next();

});
// 👉 Servir archivos estáticos (incluyendo comprobantes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 👉 Servir archivos del storage (chat, profiles, deliveries, etc.)
const storagePath = process.env.STORAGE_PATH || './storage';
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
  console.log('📁 Carpeta "storage" creada.');
}
app.use('/storage', express.static(storagePath));


// 👉 Tus rutas API generales
app.use('/api', routes);

// error 404 handler
app.use((req, res, next) => {
  console.warn(`⚠️  Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Endpoint no encontrado' });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});




export default app;
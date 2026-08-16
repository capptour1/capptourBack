/**
 * storage.service.js
 *
 * Servicio central de almacenamiento de archivos.
 * Toda la aplicación usa este servicio para subir, obtener URLs y eliminar archivos.
 *
 * Configuración vía variables de entorno:
 *   STORAGE_PATH      — ruta del directorio de almacenamiento (default: ./storage)
 *   STORAGE_BASE_URL  — URL base para acceder a los archivos (default: http://localhost:3000/storage)
 *
 * Organización física:
 *   storage/{folder}/{año}/{mes}/{uuid}.{ext}
 *
 * Ejemplo:
 *   storage/chat/2026/08/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
 */
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';
const STORAGE_URL = process.env.STORAGE_BASE_URL || 'http://localhost:3000/storage';
/**
 * Sube un archivo al almacenamiento.
 *
 * @param {Buffer} buffer — contenido binario del archivo
 * @param {string} folder — carpeta lógica (ej: 'chat', 'profiles', 'deliveries')
 * @param {string} originalName — nombre original del archivo (se usa solo para extraer extensión)
 * @param {object} [options] — opciones adicionales
 * @param {string} [options.key] — si se proporciona, usa esta ruta fija en vez de generar UUID.
 *                                  Reemplaza el archivo existente (comportamiento PUT por key).
 * @returns {{ path: string, url: string }} — ruta relativa y URL pública
 */
const upload = async (buffer, folder, originalName, { key } = {}) => {
  let relativePath;

  if (key) {
    // Modo reemplazo: usa la key proporcionada como ruta fija
    relativePath = key;
  } else {
    // Modo inmutable: genera UUID con organización año/mes
    const ext = path.extname(originalName).toLowerCase();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const filename = `${randomUUID()}${ext}`;
    relativePath = `${folder}/${year}/${month}/${filename}`;
  }

  const fullPath = path.join(STORAGE_PATH, relativePath);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);

  return { path: relativePath, url: `${STORAGE_URL}/${relativePath}` };
};

/**
 * Construye la URL pública a partir de una ruta relativa almacenada en BD.
 *
 * @param {string} relativePath — ruta almacenada en la columna `url` de adjuntos
 * @returns {string} — URL completa
 */
const getUrl = (relativePath) => {
  if (!relativePath) return null;
  // Si ya es una URL absoluta, retornar tal cual
  if (relativePath.startsWith('http')) return relativePath;
  return `${STORAGE_URL}/${relativePath}`;
};

/**
 * Elimina un archivo del almacenamiento.
 *
 * @param {string} relativePath — ruta relativa del archivo
 */
const remove = async (relativePath) => {
  if (!relativePath) return;
  const fullPath = path.join(STORAGE_PATH, relativePath);
  await fs.unlink(fullPath).catch(() => {});
};

export default { upload, getUrl, remove };

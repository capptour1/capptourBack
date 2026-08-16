/**
 * storage.service.js
 *
 * Servicio central de almacenamiento de archivos.
 * Toda la aplicación usa este servicio para subir, obtener URLs y eliminar archivos.
 *
 * El StorageService es el único responsable de generar nombres de archivo.
 * Los consumidores nunca deben depender del nombre original para el almacenamiento físico.
 *
 * Configuración vía variables de entorno:
 *   STORAGE_PATH      — ruta del directorio de almacenamiento (default: ./storage)
 *   STORAGE_BASE_URL  — URL base para acceder a los archivos (default: http://localhost:3000/storage)
 *
 * Organización física:
 *   storage/{folder}/{año}/{mes}/{uuid}.{ext}
 */
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';
const STORAGE_URL = (process.env.STORAGE_BASE_URL || 'http://localhost:3000/storage').replace(/\/+$/, '');

// ─── Mapeo MIME → extensión ───────────────────────────────────────────────────

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/ogg': '.ogg',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/zip': '.zip',
};

/**
 * Resuelve la extensión a partir de un MIME type, una extensión directa,
 * o un nombre de archivo (backward compatible).
 */
function resolveExtension(mimeOrExt) {
  if (!mimeOrExt) return '';

  // Si es un MIME type conocido
  if (MIME_TO_EXT[mimeOrExt]) return MIME_TO_EXT[mimeOrExt];

  // Si ya es una extensión (empieza con punto)
  if (mimeOrExt.startsWith('.')) return mimeOrExt.toLowerCase();

  // Si es un MIME genérico no mapeado (ej: 'application/octet-stream')
  if (mimeOrExt.includes('/')) return '';

  // Backward compatible: si parece un nombre de archivo, extraer extensión
  const ext = path.extname(mimeOrExt);
  return ext ? ext.toLowerCase() : '';
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Sube un archivo al almacenamiento.
 *
 * @param {Buffer} buffer — contenido binario del archivo
 * @param {string} folder — carpeta lógica (ej: 'chat/images', 'deliveries/images')
 * @param {string} mimeOrExt — MIME type ('image/jpeg'), extensión ('.jpg') o nombre de archivo
 * @param {object} [options] — opciones adicionales
 * @param {string} [options.key] — si se proporciona, usa esta ruta fija (modo reemplazo)
 * @returns {{ path: string, url: string }} — ruta relativa y URL pública
 */
const upload = async (buffer, folder, mimeOrExt, { key } = {}) => {
  let relativePath;

  if (key) {
    relativePath = key;
  } else {
    const ext = resolveExtension(mimeOrExt);
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
 * @param {string} relativePath — ruta almacenada en la base de datos
 * @returns {string|null} — URL completa o null
 */
const getUrl = (relativePath) => {
  if (!relativePath) return null;
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

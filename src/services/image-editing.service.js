import AppError from '../utils/appError.js';

/**
 * Contrato interno independiente del proveedor para operaciones de edición de demo.
 * Los nombres y parámetros son de CappTour, no del proveedor externo.
 */
export const EDIT_OPERATION = {
  REMOVE_BACKGROUND: 'remove_background',
  TRANSPARENT_BACKGROUND: 'transparent_background',
  SOLID_COLOR_BACKGROUND: 'solid_color_background',
  PREDESIGNED_BACKGROUND: 'predesigned_background',
  TEXT_GENERATED_BACKGROUND: 'text_generated_background',
  RELIGHTING: 'relighting',
};

/**
 * Capa de edición de imágenes de CappTour.
 *
 * Isola al proveedor de IA detrás de ImageEditingAdapter. No persiste
 * imágenes ni parámetros en base de datos. No conoce a PhotoRoom ni a
 * ningún proveedor concreto: depende de ImageEditingAdapter (abstracción).
 */
class ImageEditingService {
  /**
   * @param {ImageEditingAdapter} adapter - adaptador de proveedor de edición
   */
  constructor(adapter) {
    if (!adapter || typeof adapter.isAvailable !== 'function' || typeof adapter.edit !== 'function') {
      throw new Error('ImageEditingService requiere un adaptador que implemente ImageEditingAdapter');
    }
    this._adapter = adapter;
  }

  /**
   * Indica si la capacidad de edición está disponible.
   * La disponibilidad la determina el adaptador (credenciales, conexión, etc.).
   * Se verifica en cada llamada para permitir configuración en tiempo de ejecución.
   *
   * @returns {boolean}
   */
  isAvailable() {
    return this._adapter.isAvailable();
  }

  /**
   * Ejecuta una operación de edición sobre una imagen.
   *
   * @param {Object} params
   * @param {Buffer} params.imageBuffer - bytes de la imagen de entrada
   * @param {string} params.mimeType - MIME type de la imagen de entrada
   * @param {string} params.operation - una de EDIT_OPERATION.*
   * @param {Buffer} [params.backgroundAssetBuffer] - bytes del asset de fondo (predesignado)
   * @param {string} [params.backgroundMimeType] - MIME type del asset de fondo
   * @param {string} [params.color] - color hex para fondo sólido (ej: 'FFFFFF')
   * @param {string} [params.prompt] - instrucción de texto para fondo generado
   * @returns {Promise<Buffer>} bytes de la imagen resultante
   * @throws {AppError} con código 503 si el proveedor no está disponible
   * @throws {Error} si el adaptador lanza un error de proveedor
   */
  async edit({
    imageBuffer,
    mimeType,
    operation,
    backgroundAssetBuffer,
    backgroundMimeType,
    color,
    prompt,
  }) {
    if (!this.isAvailable()) {
      throw new AppError('IMAGE_EDITING_UNAVAILABLE', 503);
    }

    return this._adapter.edit({
      operation,
      imageBuffer,
      mimeType,
      backgroundAssetBuffer,
      backgroundMimeType,
      color,
      prompt,
    });
  }
}

export default ImageEditingService;

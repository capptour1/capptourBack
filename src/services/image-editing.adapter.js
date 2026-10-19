/**
 * Contrato de adaptador de proveedor de edición de imágenes.
 *
 * Cualquier proveedor de IA (PhotoRoom, otro servicio, etc.) debe implementar
 * esta interfaz para poder ser usado por ImageEditingService sin acoplar
 * el dominio de CappTour a un proveedor concreto.
 *
 * Los nombres de operación y parámetros son de CappTour, no del proveedor.
 * El adaptador se encarga de traducirlos a la API del proveedor subyacente.
 */
export class ImageEditingAdapter {
  /**
   * Indica si el proveedor está disponible y configurado para recibir peticiones.
   * Debe devolver true solo si el proveedor tiene credenciales válidas y puede
   * procesar operaciones.
   *
   * @returns {boolean}
   */
  isAvailable() {
    throw new Error('Method not implemented: isAvailable()');
  }

  /**
   * Ejecuta una operación de edición sobre una imagen y devuelve el buffer
   * de la imagen resultante.
   *
   * @param {Object} params
   * @param {Buffer} params.imageBuffer - bytes de la imagen de entrada
   * @param {string} params.mimeType - MIME type de la imagen de entrada
   * @param {string} params.operation - una de CappTour.EDIT_OPERATION.*
   * @param {Buffer} [params.backgroundAssetBuffer] - bytes del asset de fondo (predesignado)
   * @param {string} [params.backgroundMimeType] - MIME type del asset de fondo
   * @param {string} [params.color] - color hex para fondo sólido (ej: 'FFFFFF')
   * @param {string} [params.prompt] - instrucción de texto para fondo generado
   * @returns {Promise<Buffer>} bytes de la imagen resultante
   * @throws {Error} si el proveedor no puede completar la operación
   */
  async edit({
    operation,
    imageBuffer,
    mimeType,
    backgroundAssetBuffer,
    backgroundMimeType,
    color,
    prompt,
  }) {
    throw new Error('Method not implemented: edit()');
  }
}

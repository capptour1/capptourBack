/**
 * Adaptador de Bria Eraser para la capa de edición de CappTour.
 *
 * Implementa ImageEditingAdapter, traduciendo las operaciones de CappTour
 * a la API de Bria Eraser (https://api.bria.ai/image/edit/erase).
 *
 * No realiza llamadas externas durante el arranque del servidor;
 * solo lo hace cuando se invoca edit() y la clave está configurada.
 * Lee BRIA_API_TOKEN desde process.env en cada ejecución de edit(),
 * nunca la almacena en el constructor.
 */

import fetch from 'node-fetch';
import AppError from '../utils/appError.js';
import { ImageEditingAdapter } from './image-editing.adapter.js';

const BRIA_ERASE_API_URL = 'https://api.bria.ai/image/edit/erase';

class BriaEraserAdapter extends ImageEditingAdapter {
  constructor() {
    super();
  }

  /**
   * Indica si el proveedor Bria Eraser está disponible.
   * Verifica la presencia de BRIA_API_TOKEN en el entorno.
   *
   * @returns {boolean}
   */
  isAvailable() {
    const apiKey = process.env.BRIA_API_TOKEN;
    return Boolean(apiKey && apiKey.trim());
  }

  /**
   * Envía la operación de edición a Bria Eraser y devuelve el buffer
   * de la imagen resultante.
   *
   * @param {Object} params
   * @param {string} params.operation - operación de CappTour (EDIT_OPERATION.*)
   * @param {Buffer} params.imageBuffer - bytes de la imagen de entrada
   * @param {string} params.mimeType - MIME type de la imagen de entrada
   * @param {Buffer} [params.maskBuffer] - bytes de la máscara (para remove_object)
   * @param {string} [params.maskMimeType] - MIME type de la máscara
   * @returns {Promise<Buffer>} bytes de la imagen resultante
   * @throws {Error} si la API de Bria Eraser responde con error
   */
  async edit({
    operation,
    imageBuffer,
    mimeType,
    backgroundAssetBuffer,
    backgroundMimeType,
    color,
    prompt,
    maskBuffer,
    maskMimeType,
  }) {
    const apiKey = process.env.BRIA_API_TOKEN;
    if (!apiKey || !apiKey.trim()) {
      throw new AppError('IMAGE_EDITING_UNAVAILABLE', 503);
    }

    const formData = new FormData();

    // Imagen de entrada
    formData.append(
      'imageFile',
      new Blob([imageBuffer], { type: mimeType }),
      'image.jpg'
    );

    // Máscara para eliminar objetos
    if (maskBuffer) {
      formData.append(
        'mask',
        new Blob([maskBuffer], { type: maskMimeType }),
        'mask.png'
      );
    }

    formData.append('mask_type', 'manual');
    formData.append('composite', 'true');
    formData.append('sync', 'true');

    const response = await fetch(BRIA_ERASE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Bria Eraser API respondió ${response.status}: ${errorText}`
      );
    }

    return await response.buffer();
  }
}

export default BriaEraserAdapter;

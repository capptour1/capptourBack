/**
 * Adaptador de Bria Eraser para la capa de edición de CappTour.
 *
 * Implementa ImageEditingAdapter, traduciendo las operaciones de CappTour
 * a la API de Bria Eraser.
 *
 * Endpoint oficial (confirmado contra la PoC funcional
 * `poc-n1-eliminacion-objetos`): la base es
 * `https://engine.prod.bria-api.com/v2` y la ruta `/image/edit/erase`. La
 * autenticación va en la cabecera `api_token` y la petición es JSON con la
 * imagen y la máscara en Base64. La respuesta es JSON con
 * `result.image_url`; se descarga esa URL y se devuelve el buffer de la
 * imagen resultante (el controller lo reenvía al cliente en Base64).
 *
 * No realiza llamadas externas durante el arranque del servidor;
 * solo lo hace cuando se invoca edit() y la clave está configurada.
 * Lee BRIA_API_TOKEN desde process.env en cada ejecución de edit(),
 * nunca la almacena en el constructor.
 */

import fetch from 'node-fetch';
import AppError from '../utils/appError.js';
import { ImageEditingAdapter } from './image-editing.adapter.js';

const BRIA_API_BASE = 'https://engine.prod.bria-api.com/v2';
const BRIA_ERASE_API_URL = `${BRIA_API_BASE}/image/edit/erase`;

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
   * Realiza la petición HTTP a Bria Eraser. Aislado en un método para poder
   * interceptarlo en pruebas sin llamar al proveedor real.
   *
   * @param {string} url
   * @param {Object} options - opciones de fetch (method, headers, body)
   * @returns {Promise<Response>}
   */
  async _fetch(url, options) {
    return fetch(url, options);
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
  async edit({ imageBuffer, maskBuffer }) {
    const apiKey = process.env.BRIA_API_TOKEN;
    if (!apiKey || !apiKey.trim()) {
      throw new AppError('IMAGE_EDITING_UNAVAILABLE', 503);
    }

    if (!maskBuffer) {
      throw new AppError('mask es obligatorio para eliminación de objetos', 400);
    }

    // Petición JSON con imagen y máscara en Base64 (contrato real de Bria,
    // confirmado contra la PoC funcional).
    const payload = {
      image: imageBuffer.toString('base64'),
      mask: maskBuffer.toString('base64'),
      mask_type: 'manual', // pincel manual del usuario
      composite: true, // resultado pixel-perfect
      sync: true, // respuesta sincrónica con result.image_url
      preserve_alpha: true,
      visual_input_content_moderation: false,
      visual_output_content_moderation: false,
    };

    const response = await this._fetch(BRIA_ERASE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        api_token: apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Bria Eraser API respondió ${response.status}: ${errorText}`
      );
    }

    // Bria responde JSON: { result: { image_url }, request_id }.
    const data = await response.json();
    const imageUrl = data && data.result ? data.result.image_url : undefined;
    if (!imageUrl) {
      throw new Error(
        `Respuesta inesperada de Bria Eraser: ${JSON.stringify(data)}`
      );
    }

    // Descargar la imagen resultante y devolver sus bytes (el controller la
    // reenvía al cliente en Base64). No se persiste en CappTour.
    const imageResponse = await this._fetch(imageUrl, { method: 'GET' });
    if (!imageResponse.ok) {
      throw new Error(
        `No se pudo descargar el resultado de Bria Eraser (${imageResponse.status})`
      );
    }

    return await imageResponse.buffer();
  }
}

export default BriaEraserAdapter;
export { BRIA_API_BASE, BRIA_ERASE_API_URL };

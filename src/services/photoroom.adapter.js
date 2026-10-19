import fetch from 'node-fetch';
import AppError from '../utils/appError.js';
import { ImageEditingAdapter } from './image-editing.adapter.js';

const PHOTOROOM_API_URL = 'https://image-api.photoroom.com/v2/edit';

/**
 * Adaptador inicial de PhotoRoom para la capa de edición de CappTour.
 * Implementa ImageEditingAdapter, traduciendo las operaciones de CappTour
 * a la API de PhotoRoom.
 *
 * No realiza llamadas externas durante el arranque del servidor;
 * solo lo hace cuando se invoca edit() y la clave está configurada.
 * Lee PHOTOROOM_API_KEY desde process.env en cada ejecución de edit(),
 * nunca la almacena en el constructor.
 */
class PhotoRoomAdapter extends ImageEditingAdapter {
  constructor() {
    super();
  }

  /**
   * Indica si el proveedor PhotoRoom está disponible.
   * Verifica la presencia de PHOTOROOM_API_KEY en el entorno.
   *
   * @returns {boolean}
   */
  isAvailable() {
    const apiKey = process.env.PHOTOROOM_API_KEY;
    return Boolean(apiKey && apiKey.trim());
  }

  /**
   * Envía la operación de edición a PhotoRoom y devuelve el buffer de la imagen resultante.
   *
   * @param {Object} params
   * @param {string} params.operation - operación de CappTour (EDIT_OPERATION.*)
   * @param {Buffer} params.imageBuffer - bytes de la imagen de entrada
   * @param {string} params.mimeType - MIME type de la imagen de entrada
   * @param {Buffer} [params.backgroundAssetBuffer] - bytes del asset de fondo prediseñado
   * @param {string} [params.backgroundMimeType] - MIME type del asset de fondo
   * @param {string} [params.color] - color hex para fondo sólido (ej: 'FFFFFF')
   * @param {string} [params.prompt] - instrucción de texto para fondo generado
   * @returns {Promise<Buffer>} bytes de la imagen resultante
   * @throws {Error} si la API de PhotoRoom responde con error
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
    const apiKey = process.env.PHOTOROOM_API_KEY;
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

    // Por defecto, quitar fondo (comportamiento de PhotoRoom)
    formData.append('removeBackground', 'true');
    formData.append('export.format', 'png');

    switch (operation) {
      case 'remove_background':
        // removeBackground=true ya está seteado; fondo transparente por defecto
        break;

      case 'transparent_background':
        // removeBackground=true + sin color → fondo transparente
        break;

      case 'solid_color_background':
        if (color) {
          formData.append('background.color', color);
        }
        break;

      case 'predesigned_background':
        if (backgroundAssetBuffer && backgroundMimeType) {
          formData.append(
            'background.imageFile',
            new Blob([backgroundAssetBuffer], { type: backgroundMimeType }),
            'background.jpg'
          );
        }
        break;

      case 'text_generated_background':
        if (prompt) {
          formData.append('background.prompt', prompt);
        }
        break;

      case 'relighting':
        formData.append('lighting.mode', 'ai.auto');
        break;

      default:
        throw new Error(`Operación de edición no soportada: ${operation}`);
    }

    const response = await fetch(PHOTOROOM_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `PhotoRoom API respondió ${response.status}: ${errorText}`
      );
    }

    return await response.buffer();
  }
}

export default PhotoRoomAdapter;

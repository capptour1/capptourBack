import helperResponse from '../../../utils/helperResponse.js';
const { errorResponse, successResponse } = helperResponse;

/**
 * Operaciones de edición de demo (contrato de CappTour, no del proveedor).
 */
const EDIT_OPERATION = {
  REMOVE_BACKGROUND: 'remove_background',
  TRANSPARENT_BACKGROUND: 'transparent_background',
  SOLID_COLOR_BACKGROUND: 'solid_color_background',
  PREDESIGNED_BACKGROUND: 'predesigned_background',
  TEXT_GENERATED_BACKGROUND: 'text_generated_background',
  RELIGHTING: 'relighting',
};

const VALID_OPERATIONS = Object.values(EDIT_OPERATION);

/**
 * Controlador de edición de imágenes.
 * Orquestra la petición HTTP: recibe archivo, valida parámetros, llama al servicio
 * y devuelve el resultado de forma temporal (sin persistir en CappTour).
 * No conoce PhotoRoom ni sus parámetros; solo opera con conceptos de CappTour.
 */
class ImageEditingController {
  constructor(imageEditingService) {
    this._service = imageEditingService;
  }

  /**
   * POST /api/image-editing/edit
   * Body multipart/form-data:
   *   - image (archivo, requerido)
   *   - operation (string, requerido)
   *   - color (string hex, requerido para solid_color_background)
   *   - prompt (string, requerido para text_generated_background)
   *   - backgroundAsset (archivo, requerido para predesigned_background)
   */
  async edit(req, res) {
    try {
      // upload.fields expone los archivos en req.files (objeto con arrays), no en req.file.
      const imageFile = req.files && req.files.image ? req.files.image[0] : undefined;
      if (!imageFile) {
        return res.status(400).json({
          status: 'fail',
          message: 'Imagen requerida',
        });
      }

      const { operation, color, prompt } = req.body;

      if (!VALID_OPERATIONS.includes(operation)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Operación no válida',
        });
      }

      // Validar parámetros obligatorios por operación.
      if (operation === EDIT_OPERATION.SOLID_COLOR_BACKGROUND && (!color || color.trim() === '')) {
        return res.status(400).json({
          status: 'fail',
          message: 'color es obligatorio para fondo de color sólido',
        });
      }

      if (operation === EDIT_OPERATION.TEXT_GENERATED_BACKGROUND && (!prompt || prompt.trim() === '')) {
        return res.status(400).json({
          status: 'fail',
          message: 'prompt es obligatorio para fondo generado por texto',
        });
      }

      if (operation === EDIT_OPERATION.PREDESIGNED_BACKGROUND) {
        const bgFile = req.files && req.files.backgroundAsset ? req.files.backgroundAsset[0] : undefined;
        if (!bgFile) {
          return res.status(400).json({
            status: 'fail',
            message: 'backgroundAsset es obligatorio para fondo prediseñado',
          });
        }
      }

      let backgroundAssetBuffer = null;
      let backgroundMimeType = null;
      if (req.files && req.files.backgroundAsset) {
        const bgFile = req.files.backgroundAsset[0];
        backgroundAssetBuffer = bgFile.buffer;
        backgroundMimeType = bgFile.mimetype;
      }

      const resultBuffer = await this._service.edit({
        imageBuffer: imageFile.buffer,
        mimeType: imageFile.mimetype,
        operation,
        backgroundAssetBuffer,
        backgroundMimeType,
        color,
        prompt,
      });

      // Devolver el resultado de forma temporal al cliente para que lo guarde
      // localmente. No se persiste en storage de CappTour.
      return successResponse(
        res,
        { result: resultBuffer.toString('base64'), mimeType: 'image/png' },
        'Imagen editada correctamente',
        0
      );
    } catch (error) {
      return errorResponse(res, error);
    }
  }
}

export default ImageEditingController;

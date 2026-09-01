
import PhotographerDAO from '../dao/photographer.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import sharp from 'sharp';
import media from '../../../utils/media.js';
import photographerDao from '../dao/photographer.dao.js';
import notificationService from '../../notifications/notification.service.js';
import storageService from '../../../services/storage.service.js';

const { successResponse, errorResponse } = HelperResponse;

const { createThumbnail } = media;


const getInfoPhotoDbById = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    console.log('Get info photo by ID controller called', req.body);

    const [photographerInfo, sessionsInfo] = await Promise.all([
      PhotographerDAO.getInfoPhotoDbById(id_usuario),
      PhotographerDAO.getInfoSessionPhotoDbById(id_usuario)
    ]);

    if (!photographerInfo) {
      throw new AppError('Fotógrafo no encontrado', 404);
    }

    return successResponse(
      res,
      {
        ...photographerInfo,
        sessions: sessionsInfo
      },
      'Información del fotógrafo obtenida correctamente'
    );

  } catch (error) {
    return errorResponse(res, error);
  }
};

const changeStatusSession = async (req, res) => {
  let t;
  try {
    t = await PhotographerDAO.start_transaction();
    const { id_reserva, estado } = req.body;
    console.log('Change status session controller called', req.body);

    // 1. Obtener la reserva para conocer al destinatario
    const booking = await PhotographerDAO.getBookingOwner(id_reserva);
    if (!booking) {
      throw new AppError('Reserva no encontrada', 404);
    }

    // 2. Actualizar estado
    await PhotographerDAO.changeStatusSession(id_reserva, estado, t);
    await t.commit();

    // 3. Notificar al cliente (fuera de la transacción — no bloquea el response)
    const statusMessages = {
      A: { titulo: 'Reserva confirmada', mensaje: 'Tu sesión ha sido confirmada por el fotógrafo' },
      R: { titulo: 'Reserva rechazada', mensaje: 'El fotógrafo no pudo aceptar tu solicitud' },
      C: { titulo: 'Sesión completada', mensaje: 'Tu sesión ha sido marcada como completada' },
      X: { titulo: 'Reserva cancelada', mensaje: 'Tu reserva ha sido cancelada' },
    };

    const msg = statusMessages[estado] || { titulo: 'Actualización de reserva', mensaje: `Tu reserva cambió al estado: ${estado}` };

    notificationService.send({
      userId: booking.id_cliente,
      tipo: 'booking',
      titulo: msg.titulo,
      mensaje: msg.mensaje,
      action: 'OPEN_BOOKING',
      payload: { bookingId: Number(id_reserva), status: estado },
    }).catch(err => console.error('Error sending booking notification:', err));

    return successResponse(res, { estado }, 'Estado de la sesión actualizado correctamente');
  } catch (error) {
    if (t) {
      await t.rollback();
    }
    return errorResponse(res, error);
  }
};

const changeAvailability = async (req, res) => {
  try {
    const { id_usuario, disponibilidad } = req.body;
    console.log('Change availability controller called', req.body);
    await PhotographerDAO.changeAvailability(id_usuario, disponibilidad);
    return successResponse(res, { disponibilidad }, 'Disponibilidad del fotógrafo actualizada correctamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};

const getAllSessionsByPhotographer = async (req, res) => {
  try {
    const { id_usuario } = req.body;
    const sessions = await PhotographerDAO.getInfoSessionPhotoDbById(id_usuario);
    return successResponse(res, sessions, 'Sesiones del fotógrafo obtenidas correctamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};

const uploadImagesDelivery = async (req, res) => {
  let t;
  try {
    t = await PhotographerDAO.start_transaction();

    const { id_reserva } = req.body;
    const files = req.files;
    console.log('Files received for delivery', files);

    if (!files || files.length === 0) {
      throw new AppError('No se han proporcionado imágenes para subir', 400);
    }

    const delivery = await PhotographerDAO.createDelivery(id_reserva, t);
    const dataGallery = [];

    for (const file of files) {
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();
      dataGallery.push({
        id_entrega: delivery.id_entrega,
        imagen: file.buffer,
        thumbnail: thumbnailBuffer
      });
    }

    const uploadedImages = await PhotographerDAO.uploadImagesDelivery(dataGallery, t);

  } catch (error) {
    if (t) {
      await t.rollback();
    }
    return errorResponse(res, error);
  }
}

const uploadImageDelivery = async (req, res) => {
  let t;
  try {
    t = await PhotographerDAO.start_transaction();
    let { id_reserva, first_time } = req.body;
    id_reserva = parseInt(id_reserva);
    first_time = first_time === 'true' || first_time === true;
    const file = req.files ? req.files[0] : null;
    if (!file) {
      throw new AppError('No se ha proporcionado una imagen para subir', 400);
    }

    if (first_time) {
      console.log('First time delivery, dropping existing images for reservation', id_reserva);
      await PhotographerDAO.dropImagesDelivery(id_reserva, t);
    }

    const delivery = await PhotographerDAO.createDelivery(id_reserva, t);

    // Subir imagen al StorageService
    const uploaded = await storageService.upload(file.buffer, 'deliveries/images', file.mimetype);

    // Generar y subir thumbnail
    const thumbnailBuffer = await createThumbnail(file);
    const thumbResult = await storageService.upload(thumbnailBuffer, 'deliveries/thumbnails', file.mimetype);

    // Persistir solo rutas relativas
    const uploadedImage = await PhotographerDAO.uploadImageDelivery({
      id_entrega: delivery.id_entrega,
      url_imagen: uploaded.path,
      url_thumbnail: thumbResult.path,
      nombre: file.originalname,
      mime_type: file.mimetype,
      tamano: file.size,
    }, t);

    // Respuesta con URLs resueltas
    const resp = {
      ...uploadedImage,
      url_imagen: storageService.getUrl(uploadedImage.url_imagen),
      url_thumbnail: storageService.getUrl(uploadedImage.url_thumbnail),
    };

    await t.commit();
    return successResponse(res, resp, 'Imagen subida correctamente');
  }
  catch (error) {
    if (t) {
      await t.rollback();
    }
    return errorResponse(res, error);
  }
}

const uploadLinksDelivery = async (req, res) => {
  let t;
  try {
    t = await PhotographerDAO.start_transaction();
    const { id_reserva, gdrive_link, icloud_link, airdrop_link, microsoft_link } = req.body;
    console.log('Links received for delivery', req.body);
    const links = { gdrive_link, icloud_link, airdrop_link, microsoft_link };
    const delivery = await PhotographerDAO.createDelivery(id_reserva, t);
    const uploadedLinks = await PhotographerDAO.uploadLinksDelivery(delivery.id_entrega, links, t);
    await PhotographerDAO.completeSession(id_reserva, t);
    await t.commit();
    return successResponse(res, { message: 'Enlaces subidos correctamente' }, 'Enlaces subidos correctamente');
  }
  catch (error) {
    if (t) {
      await t.rollback();
    }
    return errorResponse(res, error);
  }
}

const deleteImageDelivery = async (req, res) => {
  try {
    const { id_imagen } = req.body;
    const deleted = await PhotographerDAO.deleteImageDelivery(id_imagen);

    // Eliminar archivos físicos si existen
    if (deleted) {
      if (deleted.url_imagen) {
        await storageService.remove(deleted.url_imagen);
      }
      if (deleted.url_thumbnail) {
        await storageService.remove(deleted.url_thumbnail);
      }
    }

    return successResponse(res, { message: 'Imagen de entrega eliminada correctamente' }, 'Imagen de entrega eliminada correctamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
}


const getServices = async (req, res) => {
  try {
    const { id_usuario } = req.body;

    const [services, gallery] = await Promise.all([
      PhotographerDAO.getInfoServices(id_usuario),
      PhotographerDAO.getInfoGallery(id_usuario)
    ]);

    const galleryMap = new Map();

    for (const image of gallery) {
      if (!galleryMap.has(image.id_servicio)) {
        galleryMap.set(image.id_servicio, []);
      }

      galleryMap.get(image.id_servicio).push({
        ...image,
        url_thumbnail: image.url_thumbnail ? storageService.getUrl(image.url_thumbnail) : null,
      });
    }

    for (const service of services) {
      service.imagenes =
        galleryMap.get(service.id_servicio) || [];
    }

    return successResponse(
      res,
      services,
      'Servicios obtenidos correctamente'
    );
  }
  catch (error) {
    return errorResponse(res, error);
  }
};



const addService = async (req, res) => {
  let t;

  try {
    t = await PhotographerDAO.start_transaction();

    let { servicio } = req.body;
    servicio = JSON.parse(servicio);

    console.log('Add service controller called', servicio);
    console.log('Files received for service', req.files);

    const serviceFiles = req.files.filter(file =>
      file.fieldname.startsWith('service_'),
    );

    const userInfo = await PhotographerDAO.getInfoPhotoDbById(
      servicio.id_usuario,
    );

    if (!userInfo) {
      throw new AppError('Fotógrafo no encontrado', 404);
    }

    // ===========================
    // Moneda (determinada por backend)
    // ===========================
    // La moneda del servicio la decide exclusivamente el backend a partir
    // del país del fotógrafo (auth.usuarios.id_pais), con USD como fallback.
    // Cualquier id_moneda enviado por el cliente se IGNORA a propósito.
    const id_moneda = await PhotographerDAO.getDefaultCurrencyByUserId(
      servicio.id_usuario,
      t,
    );

    // ===========================
    // Servicio
    // ===========================
    const dataService = {
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio_hora: servicio.precio_hora,
      id_moneda,
      editadas: servicio.editadas,
      no_editadas: servicio.no_editadas,
      id_fotografo: userInfo.id_fotografo,
    };

    const insertedService = await photographerDao.addService(
      dataService,
      t,
    );

    // ===========================
    // Categorías
    // ===========================
    if (
      Array.isArray(servicio.categorias) &&
      servicio.categorias.length > 0
    ) {
      await photographerDao.addServiceCategories(
        insertedService.id_servicio,
        servicio.categorias,
        t,
      );
    }

    // ===========================
    // Galería
    // ===========================
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const imagesData = [];

    for (const file of serviceFiles) {
      // Validar MIME
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw new AppError(`Formato no soportado: ${file.mimetype}. Solo se permiten JPEG, PNG y WebP.`, 400);
      }

      // Subir imagen y thumbnail via StorageService
      const uploaded = await storageService.upload(file.buffer, 'services/images', file.mimetype);
      const thumbBuffer = await createThumbnail(file);
      const thumbResult = await storageService.upload(thumbBuffer, 'services/thumbnails', file.mimetype);

      imagesData.push({
        id_servicio: insertedService.id_servicio,
        url_imagen: uploaded.path,
        url_thumbnail: thumbResult.path,
        nombre: file.originalname,
        mime_type: file.mimetype,
        tamano: file.size,
      });
    }

    if (imagesData.length > 0) {
      await photographerDao.addGalleryImages(imagesData, t);
    }

    await t.commit();

    return successResponse(
      res,
      insertedService,
      'Servicio agregado correctamente',
    );
  } catch (error) {
    if (t) {
      await t.rollback();
    }

    return errorResponse(res, error);
  }
};

const getLocations = async (req, res) => {
  try {
    const locations = await PhotographerDAO.getLocations();
    return successResponse(res, locations, 'Ubicaciones obtenidas correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};

export default {
  getInfoPhotoDbById,
  changeStatusSession,
  changeAvailability,
  getAllSessionsByPhotographer,
  uploadImageDelivery,
  uploadImagesDelivery,
  uploadLinksDelivery,
  deleteImageDelivery,
  getServices,
  addService,
  getLocations
};

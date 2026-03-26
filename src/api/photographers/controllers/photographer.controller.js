
import PhotographerDAO from '../dao/photographer.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import sharp from 'sharp';

const { successResponse, errorResponse } = HelperResponse;

const get_photographer_by_id = async (req, res) => {
  try {
    console.log('Get photographer by ID controller called', req.body);
    const { userId } = req.body;
    const photographer = await PhotographerDAO.get_photographer_by_id(userId);
    if (!photographer) {
      throw new AppError('Fotógrafo no encontrado', 404);
    }
    return successResponse(res, photographer, 'Fotógrafo encontrado');
  } catch (error) {
    return errorResponse(res, error);
  }
};

const update_bio = async (req, res) => {
  const transaction = await PhotographerDAO.start_transaction();
  try {
    console.log('Update bio controller called', req.body);
    const { userId, bio } = req.body;
    await PhotographerDAO.update_bio(userId, bio, transaction);
    await transaction.commit();
    return successResponse(res, null, 'Biografía actualizada correctamente');
  } catch (error) {
    await transaction.rollback();
    return errorResponse(res, error);
  }
};

const update_profile = async (req, res) => {
  let t = null;
  try {
    const { userId, ...data } = req.body;
    t = await PhotographerDAO.start_transaction();
    console.log('Update profile controller called', req.body);
    await PhotographerDAO.update_telephone(userId, data.telephone, t);
    await PhotographerDAO.update_info(userId, data, t);
    await t.commit();
    return successResponse(res, null, 'Perfil actualizado correctamente');
  } catch (error) {
    if (t) {
      await t.rollback();
    }
    return errorResponse(res, error);
  }
}

const toggle_status = async (req, res) => {
  const transaction = await PhotographerDAO.start_transaction();
  try {
    const { userId } = req.body;
    console.log('Toggle status controller called', req.body);

    // obtener el id del fotógrafo a partir del id del usuario
    const photographer = await PhotographerDAO.get_photographer_by_user(userId);
    console.log('Photographer retrieved', photographer);
    if (!photographer) {
      throw new AppError('Fotógrafo no encontrado', 404);
    }

    const newStatus = !photographer.is_active;
    console.log('New status to set', newStatus);

    let new_status = await PhotographerDAO.set_status(photographer.id, transaction);

    await transaction.commit();
    return successResponse(res, { isActive: new_status }, 'Estado actualizado correctamente');
  } catch (error) {
    await transaction.rollback();
    return errorResponse(res, error);
  }
};

const get_status = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('Get status controller called', req.body);
    const photographer = await PhotographerDAO.get_status(userId);
    if (!photographer) {
      throw new AppError('Fotógrafo no encontrado', 404);
    }
    return successResponse(res, { isActive: photographer.is_active }, 'Estado obtenido correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getImagesPortfolio = async (req, res) => {
  try {
    console.log('Get images portfolio controller called', req.body);
    const { user_id } = req.body;

    const photographer = await PhotographerDAO.get_photographer_by_user(user_id);

    const images = await PhotographerDAO.get_images_portfolio(photographer.id);
    return successResponse(res, images, 'Imágenes de portafolio obtenidas correctamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};

const deleteImage = async (req, res) => {
  try {
    console.log('Delete image controller called', req.body);
    const { image_id } = req.body;

    await PhotographerDAO.delete_image(image_id);
    return successResponse(res, { message: 'Imagen eliminada correctamente' }, 'Imagen eliminada correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};


const uploadImagePortfolio = async (req, res) => {
  try {
    const { user_id } = JSON.parse(req.body.data);
    const files = req.files;
    console.log('Files received', files);

    if (!files || files.length === 0) {
      throw new AppError('No se han proporcionado imágenes para subir', 400);
    }
    const photographer = await PhotographerDAO.get_photographer_by_user(user_id);
    let dataGallery = {};


    let file = files[0];
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();
    dataGallery = {
      id_fotografo: photographer.id,
      imagen: file.buffer,
      thumbnail: thumbnailBuffer
    };

    await PhotographerDAO.upload_image_portfolio(dataGallery);


    return successResponse(res, { message: 'Imágenes subidas correctamente' }, 'Imágenes subidas correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};


const getServices = async (req, res) => {
  try {
    console.log('Get services controller called', req.body);
    const { user_id } = req.body;
    const photographer = await PhotographerDAO.get_photographer_by_user(user_id);
    const services = await PhotographerDAO.getServices(photographer.id);
    return successResponse(res, services, 'Servicios obtenidos correctamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};

const addService = async (req, res) => {
  try {
    console.log('Add service controller called', req.body);
    const { user_id, service } = req.body;
    const photographer = await PhotographerDAO.get_photographer_by_user(user_id);

    await PhotographerDAO.addService(photographer.id, service);
    return successResponse(res, { message: 'Servicio agregado correctamente' }, 'Servicio agregado correctamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};

const deleteService = async (req, res) => {
  try {
    console.log('Delete service controller called', req.body);
    const { service_id } = req.body;
    await PhotographerDAO.deleteService(service_id);
    return successResponse(res, { message: 'Servicio eliminado correctamente' }, 'Servicio eliminado correctamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};


// NUEVO CONTROLADOR PARA BÚSQUEDA DE FOTÓGRAFOS DESDE APP MÓVIL


const getInfoPhotoDbById = async (req, res) => {
  try {
    const { id_usuario } = req.body;
    console.log('Get info photo by ID controller called', req.body);

    const photographerInfo = await PhotographerDAO.getInfoPhotoDbById(id_usuario);
    const sessionsInfo = await PhotographerDAO.getInfoSessionPhotoDbById(id_usuario);

    if (!photographerInfo) {
      throw new AppError('Fotógrafo no encontrado', 404);
    }

    const result = {
      ...photographerInfo,
      sessions: sessionsInfo
    };

    return successResponse(res, result, 'Información del fotógrafo obtenida correctamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};

const changeStatusSession = async (req, res) => {
  let t;
  try {
    t = await PhotographerDAO.start_transaction();
    const { id_reserva, estado } = req.body;
    console.log('Change status session controller called', req.body);
    await PhotographerDAO.changeStatusSession(id_reserva, estado, t);
    await t.commit();
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
    console.log('Get all sessions by photographer controller called', req.body);
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
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();
    const dataGallery = {
      id_entrega: delivery.id_entrega,
      imagen: file.buffer,
      thumbnail: thumbnailBuffer
    };
    let uploadedImage = await PhotographerDAO.uploadImageDelivery(dataGallery, t);
    const resp = {
      ...uploadedImage,
      url: `capptour.app/delivery/session/${id_reserva}`
    }
    console.log('Image uploaded for delivery', resp);
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
    console.log('Delete image delivery controller called', req.body);
    await PhotographerDAO.deleteImageDelivery(id_imagen);
    return successResponse(res, { message: 'Imagen de entrega eliminada correctamente' }, 'Imagen de entrega eliminada correctamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
}

export default {
  getPhotographerById: get_photographer_by_id,
  updateBio: update_bio,
  updateProfile: update_profile,
  toggleStatus: toggle_status,
  getStatus: get_status,
  getImagesPortfolio: getImagesPortfolio,
  deleteImage: deleteImage,
  uploadImagePortfolio: uploadImagePortfolio,
  getServices: getServices,
  addService: addService,
  deleteService: deleteService,


  getInfoPhotoDbById,
  changeStatusSession,
  changeAvailability,
  getAllSessionsByPhotographer,
  uploadImageDelivery,
  uploadImagesDelivery,
  uploadLinksDelivery,
  deleteImageDelivery
};

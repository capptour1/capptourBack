
import PhotographerDAO from '../dao/photographer.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import sharp from 'sharp';

const { successResponse, errorResponse } = HelperResponse;


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


const getServices = async (req, res) => {
  try {
    console.log('Get services controller called', req.body);
    const { id_usuario } = req.body;

    const userInfo = await PhotographerDAO.getInfoPhotoDbById(id_usuario);
    if (!userInfo) {
      throw new AppError('Fotógrafo no encontrado', 404);
    }

    let servicios = await PhotographerDAO.getInfoServices(userInfo.id_fotografo);
    const galeria = await PhotographerDAO.getInfoGallery(userInfo.id_fotografo);


    for (let servicio of servicios) {
      servicio.imagenes = galeria.filter(item => item.id_servicio === servicio.id_servicio);
    }


    return successResponse(res, servicios, 'Servicios obtenidos correctamente');
  }
  catch (error) {
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
  getServices
};

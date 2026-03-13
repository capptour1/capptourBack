
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
        console.error('Error en getInfoPhotoDbById controller:', error);
        return errorResponse(res, error);
    }
};

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
};

import UserDAO from '../dao/user.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import sharp from 'sharp';
import userDao from '../dao/user.dao.js';

const { successResponse, errorResponse } = HelperResponse;

/* NUEVO CONTROLADOR PARA BÚSQUEDA DE FOTÓGRAFOS DESDE APP MÓVIL */


const get_monedas = async (req, res) => {
  try {
    console.log('Get monedas controller called');
    const monedas = await UserDAO.get_monedas();
    return successResponse(res, monedas, 'Monedas obtenidas exitosamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};


const getInfoPhotoById = async (req, res) => {
  try {
    console.log('Get info photographer by ID controller called', req.body);
    const { id_fotografo } = req.body;
    const userInfo = await UserDAO.getInfoPhotoById(id_fotografo);
    if (!userInfo) {
      throw new AppError('Información del fotógrafo no encontrada', 404);
    }
    const servicios = await UserDAO.getInfoServicesByPhotographerId(id_fotografo);
    const galeria = await UserDAO.getInfoGalleryByPhotographerId(id_fotografo);
    const data = {
      userInfo: userInfo,
      servicios: servicios,
      galeria: galeria
    };
    return successResponse(res, data, 'Información del fotógrafo encontrada');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};

const getServicesGalleryByPhotographerId = async (req, res) => {
  try {
    console.log('Get info services by photographer ID controller called', req.body);
    const { id_fotografo } = req.body;
    const servicios = await UserDAO.getInfoServicesByPhotographerId(id_fotografo);
    const galeria = await UserDAO.getInfoGalleryByPhotographerId(id_fotografo);
    const data = {
      servicios: servicios,
      galeria: galeria
    };
    return successResponse(res, data, 'Servicios del fotógrafo encontrados');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};

const getServicesByPhotographerId = async (req, res) => {
  try {
    console.log('Get info services by photographer ID controller called', req.body);
    const { id_fotografo } = req.body;
    const servicios = await UserDAO.getInfoServicesByPhotographerId(id_fotografo);
    return successResponse(res, servicios, 'Servicios del fotógrafo encontrados');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};

const addServiceRequest = async (req, res) => {
  let t = null;
  try {
    t = await UserDAO.getTransaction();
    const { id_cliente, id_fotografo, id_servicio, fecha, hora_inicio, hora_fin, longitud, latitud, notas } = req.body;
    const info = {
      id_cliente,
      id_servicio,
      fecha,
      hora_inicio,
      hora_fin,
      longitud,
      latitud,
      notas
    }
    console.log('Add service request controller called with data:', info);
    const reservation = await UserDAO.addServiceRequest(info, t);
    const basicInfoPhotographer = await UserDAO.getBasicInfoPhotographerById(id_fotografo);
    const basicInfoService = await UserDAO.getBasicInfoServiceById(id_servicio);
    const response = {
      id_reserva: reservation.id_reserva,
      id_cliente,
      id_fotografo: basicInfoPhotographer.id_fotografo,
      rol: basicInfoPhotographer.rol,
      experiencia: basicInfoPhotographer.experiencia,
      id_servicio,
      nombre_servicio: basicInfoService.nombre,
      fecha,
      hora_inicio,
      hora_fin,
      longitud,
      latitud,
      notas,
      nombre_fotografo: basicInfoPhotographer.nombre
    };
    console.log('Service request created with data:', response);
    await t.commit();
    return successResponse(res, response, 'Reserva creada exitosamente');
  } catch (error) {
    if (t) await t.rollback();
    return errorResponse(res, error);
  }
};


const getCountries = async (req, res) => {
  try {
    console.log('Get countries controller called');
    const countries = await UserDAO.getCountries();
    console.log('Countries obtained:', countries);
    return successResponse(res, countries, 'Países obtenidos exitosamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};

const getGenders = async (req, res) => {
  try {
    console.log('Get genders controller called');
    const genders = await UserDAO.getGenders();
    return successResponse(res, genders, 'Géneros obtenidos exitosamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};


const getInfoUserById = async (req, res) => {
  try {
    console.log('Get info user by ID controller called', req.body);
    const { id_usuario, id_rol } = req.body;
    const userInfo = await UserDAO.getInfoUserById(id_usuario, id_rol);
    if (!userInfo) {
      throw new AppError('Información del usuario no encontrada', 404);
    }
    return successResponse(res, userInfo, 'Información del usuario encontrada');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};


const updateProfilePicture = async (req, res) => {
  try {
    const { id_usuario } = req.body;
    const file = req.files ? req.files[0] : null;
    if (!file) {
      throw new AppError('No se ha proporcionado una imagen para subir', 400);
    }
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();

    const updatedUser = await UserDAO.updateProfilePicture(id_usuario, thumbnailBuffer);
    return successResponse(res, updatedUser, 'Foto de perfil actualizada exitosamente');
  }
  catch (error) {
    return errorResponse(res, error);
  }
};

const updateProfile = async (req, res) => {
  let t = null;
  try {
    t = await UserDAO.getTransaction();
    console.log('Update info user by ID controller called');
    const {
      id_usuario,
      id_rol,
      nombre_completo,
      descripcion,
      herramientas,
      email,
      pais_telefono,
      pais_usuario,
      id_genero,
      telefono,
      fecha_nacimiento
    } = req.body;

    const info = {
      nombre_completo,
      pais_usuario,
      id_genero,
      fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
    };

    const infoPhotographer = {
      descripcion,
      herramientas
    };

    const infoPhone = {
      pais_telefono,
      telefono
    };

    const updatedUser = await UserDAO.updateProfile(id_usuario, info, t);
    const updateTelefono = await UserDAO.updateInfoPhoneByUserId(id_usuario, infoPhone, t);

    if (id_rol === 5) {
      const updatedPhotographer = await UserDAO.updateInfoPhotographerById(id_usuario, infoPhotographer, t);
    }
    await t.commit();
    return successResponse(res, updatedUser, 'Información del usuario actualizada exitosamente');
  } catch (error) {
    if (t) await t.rollback();
    return errorResponse(res, error);
  }
};

const submitServiceRating = async (req, res) => {
  try {
    const {
      id_reserva,
      puntualidad,
      calidad_fotos,
      profesionalismo,
      relacion_calidad_precio,
      recomendacion,
      comentario
    } = req.body;

    if (!id_reserva) {
      throw new AppError('id_reserva is required', 400);
    }

    const ratingData = {
      id_reserva,
      puntualidad,
      calidad_fotos,
      profesionalismo,
      relacion_calidad_precio,
      recomendacion,
      comentario
    };

    const resp = await userDao.submitServiceRating(ratingData);
    console.log('Service rating submitted with data:', ratingData, 'Response:', resp);
    if (!resp) {
      throw new AppError('Failed to submit service rating', 500);
    }

    return successResponse(res, resp, 'Service rating submitted successfully');
  }
  catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const getFullImagesByBookingId = async (req, res) => {
  console.log('Get full images by booking ID controller called', req.body);
  try {
    const { id_reserva } = req.body;
    if (!id_reserva) {
      throw new AppError('id_reserva is required', 400);
    }

    const images = await userDao.getFullImagesByBookingId(id_reserva);
    return successResponse(res, images, 'Full images obtained successfully');
  }
  catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const getImageById = async (req, res) => {
  console.log('Get image by ID controller called with ID:', req.params.id);
  try {
    const { id } = req.params;

    const imageBuffer = await userDao.getImageById(id);

    if (!imageBuffer) {
      return res.status(404).send('Image not found');
    }

    res.set('Content-Type', 'image/jpeg'); 
    res.send(imageBuffer);

  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

export default {
  get_monedas,
  getInfoPhotoById,
  getServicesGalleryByPhotographerId,
  updateProfilePicture,
  getServicesByPhotographerId,
  addServiceRequest,
  getCountries,
  getGenders,
  getInfoUserById,
  updateProfile,
  submitServiceRating,
  getFullImagesByBookingId,
  getImageById,
  
};

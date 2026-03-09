import UserDAO from '../dao/user.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

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

export default {

  get_monedas,
  getInfoPhotoById,
  getServicesGalleryByPhotographerId,
  getServicesByPhotographerId 
};
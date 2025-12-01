
import PhotographerDAO from '../dao/photographer.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

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
    await PhotographerDAO.toggle_status(userId, transaction);
    await transaction.commit();
    return successResponse(res, null, 'Estado actualizado correctamente');
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

export default {
  getPhotographerById: get_photographer_by_id,
  updateBio: update_bio,
  updateProfile: update_profile,
  toggleStatus: toggle_status,
  getStatus: get_status
};

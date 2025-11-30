
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
  try {
    // separar userId del resto de datos
    const { userId, ...data } = req.body;
    console.log('Update profile controller called', userId, data);
    return successResponse(res, null, 'Perfil actualizado correctamente');
  } catch (error) {
    return errorResponse(res, error);
  }
}

export default {
  getPhotographerById: get_photographer_by_id,
  updateBio: update_bio,
  updateProfile: update_profile
};

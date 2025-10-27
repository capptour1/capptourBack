
import AuthDAO from '../dao/auth.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;


const register_client = async (req, res) => {
  let t = null;
  try {
    t = await AuthDAO.start_transaction();
    console.log('Register client controller called', req.body);
    const { name, phone, email, password } = req.body;

    const emailExists = await AuthDAO.check_email_exists(email);
    if (emailExists) {
      throw new AppError('Email already registered', 500);
    }

    const result = await AuthDAO.register_client(name, phone, email, password);
    await t.commit();
    return successResponse(res, result, 'Client registered successfully');
  } catch (error) {
    if (t) {
      await t.rollback();
    }
    return errorResponse(res, error);
  }
};

const register_photographer = async (req, res) => {
  let t = null;
  try {
    t = await AuthDAO.start_transaction();
    console.log('Register photographer controller called', req.body);
    const { name, phone, email, password } = req.body;

    const emailExists = await AuthDAO.check_email_exists(email);
    if (emailExists) {
      throw new AppError('Email already registered', 500);
    }

    const result = await AuthDAO.register_photographer(name, phone, email, password, t);
    await t.commit();
    return successResponse(res, result, 'Photographer registered successfully');
  } catch (error) {
    if (t) {
      await t.rollback();
    }
    return errorResponse(res, error);
  }
};

export default {
  register_client,
  register_photographer,
};

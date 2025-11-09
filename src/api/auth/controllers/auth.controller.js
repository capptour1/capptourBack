
import AuthDAO from '../dao/auth.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import jwt from 'jsonwebtoken';
const SECRET_KEY = 'secret_key'; // ← CLAVE UNIFICADA

const { successResponse, errorResponse } = HelperResponse;


const login = async (req, res) => {
  try {
    console.log('Login controller called', req.body);
    // Implement login logic here
    const { email, password } = req.body;

    const user = await AuthDAO.find_user_by_email(email);
    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const isPasswordValid = await AuthDAO.verify_password(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.rol_id },
      SECRET_KEY, // ← MISMA CLAVE QUE EL MIDDLEWARE
      { expiresIn: '2h' }
    );

    console.log('🔑 LOGIN - Token generado con clave unificada')
    return successResponse(res, { token: token, userId: user.id, role: user.rol_id }, 'Login exitoso');


  } catch (error) {
    return errorResponse(res, error);
  }
};

const register_client = async (req, res) => {
  let t = null;
  try {
    t = await AuthDAO.start_transaction();
    console.log('Register client controller called', req.body);
    const { name, email, password } = req.body;

    const emailExists = await AuthDAO.check_email_exists(email);
    if (emailExists) {
      throw new AppError('Email ya registrado', 500);
    }

    const result = await AuthDAO.register_client(name, email, password);
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
    const { name, email, password } = req.body;

    const emailExists = await AuthDAO.check_email_exists(email);
    if (emailExists) {
      throw new AppError('Email ya registrado', 500);
    }

    const result = await AuthDAO.register_photographer(name, email, password, t);
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
  login,
  register_client,
  register_photographer,
};

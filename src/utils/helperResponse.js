
import AppError from './appError.js';

// Respuesta exitosa
const successResponse = (res, data, message = 'Success', appCode = 0) => {
  return res.status(200).json({
    status: 'success',
    message,
    appCode, // útil para lógica adicional en el frontend o middlewares
    data,
  });
};

// Respuesta de error
const errorResponse = (res, error) => {
  if (error instanceof AppError) {
    console.error('[APP_ERROR]', error);
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message
    });
  }

  // Error inesperado
  console.error('[UNHANDLED_ERROR]', error);
  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error'
  });
};

export default {
  successResponse,
  errorResponse,
};
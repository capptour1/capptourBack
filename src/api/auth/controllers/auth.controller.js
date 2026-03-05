
import AuthDAO from '../dao/auth.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import media from '../../../utils/media.js';
const SECRET_KEY = 'secret_key'; // ← CLAVE UNIFICADA

const { createThumbnail } = media;
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

    const isPasswordValid = await AuthDAO.verify_password(
      password,
      user.password,
      user.id
    );

    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.rol_id },
      SECRET_KEY, // ← MISMA CLAVE QUE EL MIDDLEWARE
      { expiresIn: '2h' }
    );

    return successResponse(res, { token: token, userId: user.id, role: user.rol_id }, 'Login exitoso');


  } catch (error) {
    return errorResponse(res, error);
  }
};


// NUEVO CONTROLADOR PARA REGISTRO DE CLIENTE DESDE APP MÓVIL

const new_register_client = async (req, res) => {
  let t = null;
  try {
    t = await AuthDAO.start_transaction();
    console.log('New register client controller called', req.body);
    const { name, email, password } = req.body;

    const emailExists = await AuthDAO.check_email_exists(email);
    if (emailExists) {
      throw new AppError('Email ya registrado', 500);
    }

    const result = await AuthDAO.register_client(name, email, password, t);
    await t.commit();
    return successResponse(res, result, 'Client registered successfully');
  }
  catch (error) {
    if (t) {
      await t.rollback();
    }
    return errorResponse(res, error);
  }
};

const new_register_photographer = async (req, res) => {
  let t = null;
  try {
    console.log('New register photographer controller called');

    let { session, photographer, services } = req.body;

    if (!session || !photographer || !services) {
      return errorResponse(res, new AppError('Faltan datos obligatorios', 400));
    }


    t = await AuthDAO.start_transaction();

    session = JSON.parse(session);
    photographer = JSON.parse(photographer);
    services = JSON.parse(services);

    console.log('Session data:', session);
    console.log('Photographer data:', photographer);
    console.log('Services data:', services);

    const emailExists = await AuthDAO.check_email_exists(session.email);
    if (emailExists) {
      throw new AppError('Email ya registrado', 500);
    }

    const personal = await AuthDAO.register_user_photographer(session.name, session.email, session.password, t);
    // Crear registro en tabla photographers
    const id_experience = photographer.experience;
    const id_rol = photographer.rolType;
    const infoPhoto = await AuthDAO.register_photographer_v2(personal.id, id_experience, id_rol, t);


    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const dataService = {
        nombre: service.name,
        descripcion: service.description,
        precio_hora: service.price_hour,
        id_moneda: service.currency_id,
        editadas: service.edited,
        no_editadas: service.unedited,
        id_fotografo: infoPhoto.id
      };


      const insertedService = await AuthDAO.register_services_v2(dataService, t);

      // buscar todas las fotos del servicio actual
      const serviceFiles = req.files.filter(file => file.fieldname.startsWith(`service_${service.id}_`));

      let imagesData = [];

      for (let j = 0; j < serviceFiles.length; j++) {
        const file = serviceFiles[j];
        const thumbnailBuffer = await createThumbnail(file);

        imagesData.push({
          id_servicio: insertedService.id_servicio,
          imagen: file,
          thumbnail: thumbnailBuffer
        });
      }

      await AuthDAO.register_gallery_images_v2(imagesData, t);
    }


    await t.commit()
    return successResponse(res, {}, 'Photographer registered successfully');
  } catch (error) {
    if (t) {
      await t.rollback();
    }
    return errorResponse(res, error);
  }

}


export default {
  login,
  new_register_client,
  new_register_photographer,
};

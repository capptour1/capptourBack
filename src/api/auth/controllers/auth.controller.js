
import AuthDAO from '../dao/auth.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
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

    const result = await AuthDAO.register_client(name, email, password, t);
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
    console.log('Register photographer controller called');
    t = await AuthDAO.start_transaction();

    const data = JSON.parse(req.body.data);
    const files = req.files;


    // guardar datos de sesion
    const { name, email, password } = data.personal;

    const emailExists = await AuthDAO.check_email_exists(email);
    console.log('Email existence check for', email, ':', emailExists);
    if (emailExists) {
      console.error('Email ya registrado:', email);
      throw new AppError('Email ya registrado', 500);
    }

    const personal = await AuthDAO.register_user_photographer(name, email, password, t);
    // Crear registro en tabla photographers
    const photographer = await AuthDAO.register_photographer(personal.id, t);

    // Guardar experiencia junto con el archivo en binario (cv)
    const experience = data.experience;
    const cvFile = files.find(file => file.fieldname === 'cv');
    await AuthDAO.register_experience(photographer.id, experience, cvFile, t);

    // guardar portfolio con foto principal
    const portfolioData = data.portfolio;
    const mainPhotoFile = files.find(file => file.fieldname === 'main_photo');

    // create thumbnail using sharp
    const thumbnailBuffer = await sharp(mainPhotoFile.buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 70 }) // reduce tamaño manteniendo buena calidad
      .toBuffer();

    await AuthDAO.register_portfolio(photographer.id, portfolioData, mainPhotoFile, thumbnailBuffer, t);

    // guardar servicios
    const services = data.services;

    let dataServices = [];

    for (let i = 0; i < services.length; i++) {
      dataServices.push({
        id_fotografo: photographer.id,
        nombre: services[i].name,
        descripcion: services[i].description,
        precio_hora_cop: services[i].price_per_hour_cop,
        precio_hora_usd: services[i].price_per_hour_usd,
        precio_foto_cop: services[i].price_per_photo_cop,
        precio_foto_usd: services[i].price_per_photo_usd,
        fotos_editadas: services[i].edited_photos,
        fotos_sin_editar: services[i].unedited_photos
      });
    }

    await AuthDAO.register_services(dataServices, t);

    console.log('Preparing to save gallery photos', req.files);
    // guardar fotos de la galeria
    const galleryFiles = files.filter(f => f.fieldname.startsWith("gallery"));
    console.log('Gallery files found:', galleryFiles.length);
    let dataGallery = [];

    for (let i = 0; i < galleryFiles.length; i++) {
      const file = galleryFiles[i];
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 70 }) // reduce tamaño manteniendo buena calidad
        .toBuffer();
      dataGallery.push({
        id_fotografo: photographer.id,
        imagen: file,
        thumbnail: thumbnailBuffer
      });
    }


    console.log('Gallery files to be saved:', dataGallery.length);

    await AuthDAO.register_gallery(dataGallery, t);

    await t.commit();

    return successResponse(res, {}, 'Photographer registered successfully');
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

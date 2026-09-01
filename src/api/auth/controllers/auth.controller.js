import AuthDAO from '../dao/auth.dao.js';
import PhotographerDAO from '../../photographers/dao/photographer.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import media from '../../../utils/media.js';
import storageService from '../../../services/storage.service.js';

const { createThumbnail } = media;
const { successResponse, errorResponse } = HelperResponse;

// JWT secret desde env; fallback al valor legacy para no romper tokens existentes
const SECRET_KEY = process.env.JWT_SECRET || 'secret_key';
const TOKEN_EXPIRY = '7d'; // aumentado de 2h a 7d para evitar cierres de sesión frecuentes

// Cliente de Google para verificar idTokens
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Login email/password ─────────────────────────────────────────────────────

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await AuthDAO.find_user_by_email(email);
    if (!user) {
      throw new AppError('No se encontró un usuario con ese email', 401);
    }

    // Usuarios de social login no tienen password local
    if (!user.password) {
      throw new AppError('Esta cuenta usa inicio de sesión con Google o Apple', 401);
    }

    const isPasswordValid = await AuthDAO.verify_password(password, user.password, user.id);
    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const photographerInfo = await AuthDAO.find_photographer_by_user_id(user.id);

    const token = jwt.sign(
      { userId: user.id, userType: user.tipo_usuario },
      SECRET_KEY,
      { expiresIn: TOKEN_EXPIRY }
    );

    return successResponse(res, {
      token,
      userId: user.id,
      userType: user.tipo_usuario,
      photographerId: photographerInfo ? photographerInfo.id : null,
    }, 'Login exitoso');

  } catch (error) {
    return errorResponse(res, error);
  }
};

// ─── Social Login (Google + Apple) ───────────────────────────────────────────

const socialLogin = async (req, res) => {
  let t = null;
  try {
    const { provider, idToken, email, fullName } = req.body;

    if (!provider || !idToken) {
      throw new AppError('Faltan datos obligatorios: provider e idToken', 400);
    }

    // 1. Verificar el token con el proveedor correspondiente
    let providerSub, providerEmail;

    if (provider === 'google') {
      let ticket;
      try {
        ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
      } catch {
        throw new AppError('Token de Google inválido o expirado', 401);
      }
      const payload = ticket.getPayload();
      providerSub = payload.sub;
      providerEmail = payload.email;

    } else if (provider === 'apple') {
      let payload;
      try {
        payload = await appleSignin.verifyIdToken(idToken, {
          audience: process.env.APPLE_CLIENT_ID,
          ignoreExpiration: false,
        });
      } catch {
        throw new AppError('Token de Apple inválido o expirado', 401);
      }
      providerSub = payload.sub;
      // Apple solo envía email en el primer login
      providerEmail = payload.email || email;

    } else {
      throw new AppError(`Proveedor no soportado: ${provider}`, 400);
    }

    // 2. Buscar usuario por proveedor_id (ya se registró antes con este proveedor)
    let user = await AuthDAO.find_user_by_provider(provider, providerSub);

    if (!user) {
      const emailToUse = providerEmail || email;

      // 3. Buscar por email (puede tener cuenta local con ese email)
      if (emailToUse) {
        user = await AuthDAO.find_user_by_email(emailToUse);
        if (user) {
          // Vincular el proveedor a la cuenta existente
          await AuthDAO.link_provider_to_user(user.id, provider, providerSub);
        }
      }

      // 4. Crear usuario nuevo si no existe de ninguna forma
      if (!user) {
        if (!emailToUse) {
          throw new AppError(
            'No se pudo obtener el email del proveedor. Intenta de nuevo.',
            400
          );
        }

        const nameToUse =
          fullName ||
          (emailToUse ? emailToUse.split('@')[0] : 'Usuario');

        t = await AuthDAO.start_transaction();
        user = await AuthDAO.register_social_user(
          nameToUse,
          emailToUse,
          provider,
          providerSub,
          t
        );
        await t.commit();
        t = null;
      }
    }

    // 5. Buscar si el usuario es fotógrafo
    const photographerInfo = await AuthDAO.find_photographer_by_user_id(user.id);

    // 6. Generar JWT con el mismo formato que el login normal
    const token = jwt.sign(
      { userId: user.id, userType: user.tipo_usuario },
      SECRET_KEY,
      { expiresIn: TOKEN_EXPIRY }
    );

    return successResponse(res, {
      token,
      userId: user.id,
      userType: user.tipo_usuario,
      photographerId: photographerInfo ? photographerInfo.id : null,
    }, 'Login social exitoso');

  } catch (error) {
    if (t) await t.rollback();
    return errorResponse(res, error);
  }
};

// ─── Registro cliente ─────────────────────────────────────────────────────────

const new_register_client = async (req, res) => {
  let t = null;
  try {
    t = await AuthDAO.start_transaction();
    const { name, email, password } = req.body;

    const emailExists = await AuthDAO.check_email_exists(email);
    if (emailExists) {
      throw new AppError('Email ya registrado', 400);
    }

    const result = await AuthDAO.register_client(name, email, password, t);
    await t.commit();
    return successResponse(res, result, 'Client registered successfully');
  } catch (error) {
    if (t) await t.rollback();
    return errorResponse(res, error);
  }
};

// ─── Registro fotógrafo ───────────────────────────────────────────────────────

const new_register_photographer = async (req, res) => {
  let t = null;
  try {
    let { session, photographer, services } = req.body;

    if (!session || !photographer || !services) {
      return errorResponse(res, new AppError('Faltan datos obligatorios', 400));
    }

    t = await AuthDAO.start_transaction();

    session = JSON.parse(session);
    photographer = JSON.parse(photographer);
    services = JSON.parse(services);

    const emailExists = await AuthDAO.check_email_exists(session.email);
    if (emailExists) {
      throw new AppError('Email ya registrado', 400);
    }

    const personal = await AuthDAO.register_user_photographer(
      session.name,
      session.email,
      session.password,
      t
    );

    const infoPhoto = await AuthDAO.register_photographer_v2(
      personal.id,
      photographer.experience,
      photographer.rolType,
      t
    );

    // La moneda de TODOS los servicios de este registro la decide el backend
    // a partir del país del fotógrafo (auth.usuarios.id_pais), con USD como
    // fallback. Como todos los servicios pertenecen al mismo fotógrafo, se
    // resuelve UNA sola vez. Cualquier currency_id enviado por el cliente se
    // IGNORA a propósito.
    const id_moneda = await PhotographerDAO.getDefaultCurrencyByUserId(
      personal.id,
      t
    );

    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const dataService = {
        nombre: service.name,
        descripcion: service.description,
        precio_hora: service.price_hour,
        id_moneda,
        editadas: service.edited,
        no_editadas: service.unedited,
        id_fotografo: infoPhoto.id,
      };

      const insertedService = await AuthDAO.register_services_v2(dataService, t);

      const serviceFiles = req.files.filter(
        (file) => file.fieldname.startsWith(`service_${service.id}_`)
      );

      const imagesData = [];
      for (const file of serviceFiles) {
        const thumbnailBuffer = await createThumbnail(file);

        // Subir imagen original al storage
        const uploaded = await storageService.upload(
          file.buffer,
          'servicios/imagenes',
          file.mimetype
        );

        // Subir thumbnail al storage
        const thumbUploaded = await storageService.upload(
          thumbnailBuffer,
          'servicios/thumbnails',
          'image/jpeg'
        );

        imagesData.push({
          id_servicio:   insertedService.id_servicio,
          url_imagen:    uploaded.path,
          url_thumbnail: thumbUploaded.path,
          nombre:        file.originalname || null,
          mime_type:     file.mimetype     || 'image/jpeg',
          tamano:        file.size         || null,
        });
      }

      await AuthDAO.register_gallery_images_v2(imagesData, t);
    }

    await t.commit();
    return successResponse(res, {}, 'Photographer registered successfully');
  } catch (error) {
    if (t) await t.rollback();
    return errorResponse(res, error);
  }
};

// ─── Cambio de contraseña ─────────────────────────────────────────────────────

const changePassword = async (req, res) => {
  try {
    const { user_id, current_password, new_password } = req.body;

    const user = await AuthDAO.find_user_by_id(user_id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Usuarios de social login no tienen password local
    if (!user.password) {
      throw new AppError(
        'Esta cuenta usa inicio de sesión social y no tiene contraseña local',
        400
      );
    }

    const isCurrentPasswordValid = await AuthDAO.verify_password(
      current_password,
      user.password,
      user.id
    );
    if (!isCurrentPasswordValid) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    await AuthDAO.update_password(user_id, new_password);
    return successResponse(res, {}, 'Contraseña actualizada exitosamente');
  } catch (error) {
    return errorResponse(res, error);
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export default {
  login,
  socialLogin,
  new_register_client,
  new_register_photographer,
  changePassword,
};

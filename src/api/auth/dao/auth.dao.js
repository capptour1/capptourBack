import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import bcrypt from 'bcrypt';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const start_transaction = () => {
  return sequelize.transaction({ autocommit: false });
};

// ─── Email / password ─────────────────────────────────────────────────────────

const check_email_exists = async (email) => {
  try {
    const result = await sequelize.query(
      `SELECT id FROM auth.usuarios WHERE trim(lower(email)) = trim(lower(:email));`,
      { replacements: { email }, type: QueryTypes.SELECT }
    );
    return result.length > 0;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw new Error('Error al verificar la existencia del email');
  }
};

const find_user_by_email = async (email) => {
  try {
    const result = await sequelize.query(
      `SELECT * FROM auth.usuarios WHERE trim(lower(email)) = trim(lower(:email));`,
      { replacements: { email }, type: QueryTypes.SELECT }
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw new Error('Error al buscar el usuario por email');
  }
};

const find_user_by_id = async (userId) => {
  const result = await sequelize.query(
    `SELECT * FROM auth.usuarios WHERE id = :userId`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
  return result[0] || null;
};

const verify_password = async (plainPassword, storedPassword, userId) => {
  try {
    // Caso 1: password ya hasheada con bcrypt
    if (/^\$2[aby]\$/.test(storedPassword)) {
      return await bcrypt.compare(plainPassword, storedPassword);
    }

    // Caso 2: password legacy en texto plano → migrar automáticamente
    if (plainPassword === storedPassword) {
      console.log('⚠️  Password legacy detectada → migrando...');
      const newHashedPassword = await bcrypt.hash(plainPassword, 10);
      await sequelize.query(
        `UPDATE auth.usuarios SET password = :newPassword WHERE id = :userId`,
        { replacements: { newPassword: newHashedPassword, userId } }
      );
      console.log('✅ Password migrada correctamente');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying password:', error);
    throw new Error('Error al verificar la contraseña');
  }
};

const update_password = async (userId, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  await sequelize.query(
    `UPDATE auth.usuarios SET password = :password WHERE id = :userId`,
    { replacements: { password: hashedPassword, userId }, type: QueryTypes.UPDATE }
  );
};

// ─── Social login ─────────────────────────────────────────────────────────────

/**
 * Busca un usuario por su proveedor_id (Google sub / Apple sub).
 * Se usa en logins posteriores al primero para evitar crear duplicados.
 */
const find_user_by_provider = async (provider, providerId) => {
  try {
    const result = await sequelize.query(
      `SELECT * FROM auth.usuarios
       WHERE proveedor_auth = :provider AND proveedor_id = :providerId`,
      { replacements: { provider, providerId }, type: QueryTypes.SELECT }
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error finding user by provider:', error);
    throw new Error('Error al buscar el usuario por proveedor');
  }
};

/**
 * Crea un usuario nuevo que se registra por primera vez con social login.
 * No tiene password local.
 */
const register_social_user = async (name, email, provider, providerId, transaction) => {
  try {
    const result = await sequelize.query(
      `INSERT INTO auth.usuarios (nombre_completo, email, proveedor_auth, proveedor_id, tipo_usuario)
       VALUES (:name, :email, :provider, :providerId, 3)
       RETURNING *;`,
      {
        replacements: { name, email, provider, providerId },
        type: QueryTypes.INSERT,
        transaction
      }
    );
    return result[0][0];
  } catch (error) {
    console.error('Error registering social user:', error);
    throw new Error('Error al registrar el usuario con social login');
  }
};

/**
 * Vincula un proveedor social a una cuenta existente (tenía cuenta local con ese email).
 */
const link_provider_to_user = async (userId, provider, providerId) => {
  try {
    await sequelize.query(
      `UPDATE auth.usuarios
       SET proveedor_auth = :provider, proveedor_id = :providerId
       WHERE id = :userId`,
      { replacements: { userId, provider, providerId }, type: QueryTypes.UPDATE }
    );
  } catch (error) {
    console.error('Error linking provider to user:', error);
    throw new Error('Error al vincular el proveedor al usuario');
  }
};

// ─── Registro ─────────────────────────────────────────────────────────────────

const register_client = async (name, email, password, transaction) => {
  try {
    console.log('Register client DAO called');
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await sequelize.query(
      `INSERT INTO auth.usuarios (nombre_completo, email, password, tipo_usuario)
       VALUES (:name, :email, :password, 3)
       RETURNING *;`,
      {
        replacements: { name, email, password: hashedPassword },
        type: QueryTypes.INSERT,
        transaction
      }
    );
    return result[0][0];
  } catch (error) {
    console.error('Error registering client:', error);
    throw new Error('Error al registrar el cliente');
  }
};

const register_user_photographer = async (name, email, password, transaction) => {
  try {
    console.log('Register photographer user DAO called');
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await sequelize.query(
      `INSERT INTO auth.usuarios (nombre_completo, email, password, tipo_usuario)
       VALUES (:name, :email, :password, 5)
       RETURNING *;`,
      {
        replacements: { name, email, password: hashedPassword },
        type: QueryTypes.INSERT,
        transaction
      }
    );
    return result[0][0];
  } catch (error) {
    console.error('Error registering photographer user:', error);
    throw new Error('Error al registrar el fotógrafo');
  }
};

const register_photographer_v2 = async (user_id, experience_id, rol_id, transaction) => {
  try {
    const result = await sequelize.query(
      `INSERT INTO fotografo.fotografos (id_usuario, id_experiencia, id_rol)
       VALUES (:user_id, :experience_id, :rol_id)
       RETURNING *;`,
      {
        replacements: { user_id, experience_id, rol_id },
        type: QueryTypes.INSERT,
        transaction
      }
    );
    return result[0][0];
  } catch (error) {
    console.error('Error registering photographer:', error);
    throw new Error('Error al registrar el fotógrafo');
  }
};

const register_services_v2 = async (service, transaction) => {
  try {
    const result = await sequelize.query(
      `INSERT INTO fotografo.servicios
         (id_fotografo, nombre, descripcion, precio_hora, id_moneda, editadas, no_editadas)
       VALUES
         (:photographer_id, :name, :description, :price_hour, :currency_id, :edited_photos, :unedited_photos)
       RETURNING *;`,
      {
        replacements: {
          photographer_id: service.id_fotografo,
          name: service.nombre,
          description: service.descripcion,
          price_hour: service.precio_hora,
          currency_id: service.id_moneda,
          edited_photos: service.editadas,
          unedited_photos: service.no_editadas
        },
        type: QueryTypes.INSERT,
        transaction
      }
    );
    return result[0][0];
  } catch (error) {
    console.error('Error registering services:', error);
    throw new Error('Error al registrar los servicios');
  }
};

const register_gallery_images_v2 = async (imagesData, transaction) => {
  try {
    for (const item of imagesData) {
      await sequelize.query(
        `INSERT INTO fotografo.imagen_servicio (id_servicio, url_imagen, url_thumbnail, nombre, mime_type, tamano)
         VALUES (:id_servicio, :url_imagen, :url_thumbnail, :nombre, :mime_type, :tamano)`,
        {
          replacements: {
            id_servicio:   item.id_servicio,
            url_imagen:    item.url_imagen,
            url_thumbnail: item.url_thumbnail,
            nombre:        item.nombre    || null,
            mime_type:     item.mime_type || 'image/jpeg',
            tamano:        item.tamano    || null,
          },
          type: QueryTypes.INSERT,
          transaction
        }
      );
    }
  } catch (error) {
    console.error('Error registering gallery images:', error);
    throw new Error('Error al registrar las imágenes de la galería');
  }
};

// ─── Fotógrafo ────────────────────────────────────────────────────────────────

const find_photographer_by_user_id = async (user_id) => {
  try {
    const result = await sequelize.query(
      `SELECT * FROM fotografo.fotografos WHERE id_usuario = cast(:user_id AS int);`,
      { replacements: { user_id }, type: QueryTypes.SELECT }
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error finding photographer by user ID:', error);
    throw new Error('Error al buscar el fotógrafo por ID de usuario');
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export default {
  start_transaction,

  // email / password
  check_email_exists,
  find_user_by_email,
  find_user_by_id,
  verify_password,
  update_password,

  // social login
  find_user_by_provider,
  register_social_user,
  link_provider_to_user,

  // registro
  register_client,
  register_user_photographer,
  register_photographer_v2,
  register_services_v2,
  register_gallery_images_v2,

  // fotógrafo
  find_photographer_by_user_id,
};

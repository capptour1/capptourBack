import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';

import bcrypt from 'bcrypt';

const isBcryptHash = (passwordFromDB) => {
  return /^\$2[aby]\$/.test(passwordFromDB);
};


const start_transaction = () => {
  return sequelize.transaction({ autocommit: false });
}

const register_client = async (name, email, password, transaction) => {
  try {
    console.log('Register client controller called');
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await sequelize.query(
      `INSERT INTO auth.usuarios (nombre_completo, email, password, rol_id)
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



const check_email_exists = async (email) => {
  try {
    const result = await sequelize.query(
      `SELECT * FROM auth.usuarios WHERE trim(lower(email)) = trim(lower(:email));`,
      {
        replacements: { email },
        type: QueryTypes.SELECT,
      }
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
      {
        replacements: { email },
        type: QueryTypes.SELECT,
      }
    );
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw new Error('Error al buscar el usuario por email');
  }
};

const find_photographer_by_user_id = async (user_id) => {
  try {
    const result = await sequelize.query(
      `SELECT * FROM fotografo.fotografos WHERE usuario_id = cast(:user_id AS int);`,
      {
        replacements: { user_id },
        type: QueryTypes.SELECT,
      }
    );
    return result.length > 0 ? result[0] : null;
  }
  catch (error) {
    console.error('Error finding photographer by user ID:', error);
    throw new Error('Error al buscar el fotógrafo por ID de usuario');
  }
};

const verify_password = async (plainPassword, storedPassword, userId) => {
  try {

    // 🟢 Caso 1: Usuario ya migrado
    if (/^\$2[aby]\$/.test(storedPassword)) {
      return await bcrypt.compare(plainPassword, storedPassword);
    }

    // 🔴 Caso 2: Usuario legacy (texto plano)
    if (plainPassword === storedPassword) {

      console.log("⚠️ Password legacy detectada → migrando...");

      // 🔐 Hashear inmediatamente
      const newHashedPassword = await bcrypt.hash(plainPassword, 10);

      // 💾 Guardar nueva password hasheada
      await sequelize.query(
        `UPDATE auth.usuarios 
         SET password = :newPassword
         WHERE id = :userId`,
        {
          replacements: {
            newPassword: newHashedPassword,
            userId
          }
        }
      );

      console.log("✅ Password migrada correctamente");

      return true;
    }

    return false;

  } catch (error) {
    console.error('Error verifying password:', error);
    throw new Error('Error al verificar la contraseña');
  }
};

const register_user_photographer = async (name, email, password, transaction) => {
  try {
    console.log('Register photographer user controller called');
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await sequelize.query(
      `INSERT INTO auth.usuarios (nombre_completo, email, password, rol_id)
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
      `INSERT INTO fotografo.fotografos (usuario_id, id_experiencia, id_rol)
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
      `INSERT INTO fotografo.servicios (id_fotografo, nombre, descripcion, precio_hora,
        id_moneda, editadas, no_editadas)
        VALUES (:photographer_id, :name, :description, :price_hour,
        :currency_id, :edited_photos, :unedited_photos)
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
    for (let i = 0; i < imagesData.length; i++) {
      const item = imagesData[i];
      await sequelize.query(
        `INSERT INTO fotografo.imagen_servicio (id_servicio, imagen, thumbnail)
        VALUES (:id_servicio, :imagen, :thumbnail)`,
        {
          replacements: {
            id_servicio: item.id_servicio,
            imagen: item.imagen.buffer,
            thumbnail: item.thumbnail
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



export default {
  start_transaction,
  register_client,
  check_email_exists,
  find_user_by_email,
  find_photographer_by_user_id,
  verify_password,

  register_user_photographer,

  // NEW ENDPOINT
  register_photographer_v2,
  register_services_v2,
  register_gallery_images_v2,
};



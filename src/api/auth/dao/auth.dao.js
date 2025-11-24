import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';

const start_transaction = () => {
  return sequelize.transaction({autocommit: false});
}

const register_client = async (name, email, password, transaction) => {
  try {
    console.log('Register client controller called');

    const result = await sequelize.query(
      `INSERT INTO auth.usuarios (nombre_completo, email, password, rol_id)
       VALUES (:name, :email, :password, 3)
       RETURNING *;`,
      {
        replacements: { name, email, password },
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

const verify_password = async (password, hashedPassword) => {
  try {
    //return await bcrypt.compare(password, hashedPassword);
    return password === hashedPassword;
  } catch (error) {
    console.error('Error verifying password:', error);
    throw new Error('Error al verificar la contraseña');
  }
};

const register_user_photographer = async (name, email, password, transaction) => {
  try {
    console.log('Register photographer user controller called');

    const result = await sequelize.query(
      `INSERT INTO auth.usuarios (nombre_completo, email, password, rol_id)
       VALUES (:name, :email, :password, 5)
       RETURNING *;`,
      {
        replacements: { name, email, password },
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


const register_photographer = async (user_id, transaction) => {
  try {
    const result = await sequelize.query(
      `INSERT INTO fotografo.fotografos (usuario_id)
       VALUES (:user_id)
       RETURNING *;`,
      {
        replacements: { user_id },
        type: QueryTypes.INSERT,
        transaction
      }
    );
    return result[0][0];
  } catch (error) {
    console.error('Error registering photographer:', error);
    throw new Error('Error al registrar el fotógrafo');
  }
}

const register_experience = async (photographer_id, experience, cvFile, transaction) => {
  try {
    const result = await sequelize.query(
      `INSERT INTO fotografo.foto_experiencia (id_fotografo, id_tipo_exp, id_herramientas, hoja_vida)
       VALUES (:photographer_id, :experience_type, :tools_id, :cv_file)`,
      {
        replacements: {
          photographer_id,
          experience_type: experience.id_experience,
          tools_id: experience.id_work_tool,
          cv_file: cvFile.buffer,
        },
        type: QueryTypes.INSERT,
        transaction
      }
    );
    return result[0][0];
  } catch (error) {
    console.error('Error registering experience:', error);
    throw new Error('Error al registrar la experiencia');
  }
};


const register_portfolio = async (photographer_id, portfolioData, mainPhotoFile, thumbnail, transaction) => {
  try {
    const result = await sequelize.query(
      `INSERT INTO fotografo.foto_portafolio (id_fotografo, descripcion, ubicacion, precio_hora_cop,
        precio_hora_usd, precio_foto_cop, precio_foto_usd, fotografia, thumbnail)
        VALUES (:photographer_id, :description, :location, :price_per_hour_cop,
        :price_per_hour_usd, :price_per_photo_cop, :price_per_photo_usd, :photo, :thumbnail)`,
      {
        replacements: {
          photographer_id,
          description: portfolioData.description,
          location: JSON.stringify(portfolioData.location),
          price_per_hour_cop: portfolioData.price_per_hour_cop,
          price_per_hour_usd: portfolioData.price_per_hour_usd,
          price_per_photo_cop: portfolioData.price_per_photo_cop,
          price_per_photo_usd: portfolioData.price_per_photo_usd,
          photo: mainPhotoFile.buffer,
          thumbnail: thumbnail,
        },
        type: QueryTypes.INSERT,
        transaction
      }
    );
    return result[0][0];
  } catch (error) {
    console.error('Error registering portfolio:', error);
    throw new Error('Error al registrar el portafolio');
  }
};

const register_services = async (servicesData, transaction) => {
  try {
    for (let i = 0; i < servicesData.length; i++) {
      const service = servicesData[i];
      await sequelize.query(
        `INSERT INTO fotografo.foto_servicio (id_fotografo, nombre, descripcion, precio_hora_cop,
          precio_hora_usd, precio_foto_cop, precio_foto_usd, fotos_editadas, fotos_sin_editar)
          VALUES (:photographer_id, :name, :description, :price_per_hour_cop,
          :price_per_hour_usd, :price_per_photo_cop, :price_per_photo_usd, :edited_photos, :unedited_photos)`,
        {
          replacements: {
            photographer_id: service.id_fotografo,
            name: service.nombre,
            description: service.descripcion,
            price_per_hour_cop: service.precio_hora_cop,
            price_per_hour_usd: service.precio_hora_usd,
            price_per_photo_cop: service.precio_foto_cop,
            price_per_photo_usd: service.precio_foto_usd,
            edited_photos: service.fotos_editadas,
            unedited_photos: service.fotos_sin_editar
          },
          type: QueryTypes.INSERT,
          transaction
        }
      );
    }
  } catch (error) {
    console.error('Error registering services:', error);
    throw new Error('Error al registrar los servicios');
  }
};

const register_gallery = async (galleryData, transaction) => {
  try {
    for (let i = 0; i < galleryData.length; i++) {
      const item = galleryData[i];
      await sequelize.query(
        `INSERT INTO fotografo.foto_galeria (id_fotografo, imagen, thumbnail)
        VALUES (:id_fotografo, :imagen, :thumbnail)`,
        {
          replacements: {
            id_fotografo: item.id_fotografo,
            imagen: item.imagen.buffer,
            thumbnail: item.thumbnail
          },
          type: QueryTypes.INSERT,
          transaction
        }
      );
    }
  } catch (error) {
    console.error('Error registering gallery:', error);
    throw new Error('Error al registrar la galería');
  }
};

export default {
  start_transaction,
  register_client,
  check_email_exists,
  find_user_by_email,
  verify_password,

  register_user_photographer,
  register_photographer,
  register_experience,
  register_portfolio,
  register_services,
  register_gallery
};



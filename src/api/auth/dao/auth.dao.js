import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';

/*
 const insertQuery = `
      INSERT INTO auth.usuarios
      (nombre_completo, email, password, rol_id, telefono, servicio_id, creado_en, estado, verificado, codigo_verificacion)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'A', false, $7)
      RETURNING *;
    `;

    const values = [nombre, email, password, rol_id, telefono, servicio_id ?? null, codigo];
    const result = await pool.query(insertQuery, values);


*/
const start_transaction = () => {
  return sequelize.transaction({autocommit: false});
}

const register_client = async (name, phone, email, password, transaction) => {
  try {
    console.log('Register client controller called');

    const result = await sequelize.query(
      `INSERT INTO auth.usuarios (nombre_completo, telefono, email, password, rol_id)
       VALUES (:name, :phone, :email, :password, 3)
       RETURNING *;`,
      {
        replacements: { name, phone, email, password },
        type: QueryTypes.INSERT,
        transaction
      }
    );

    return result;
  } catch (error) {
    console.error('Error registering client:', error);
    throw new Error('Error registering client');
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
    throw new Error('Error checking email existence');
  }
};

export default {
  start_transaction,
  register_client,
  check_email_exists,
};

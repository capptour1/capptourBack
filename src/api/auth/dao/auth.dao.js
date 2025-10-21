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


const register_client = async (name, email, password) => {
  try {
    console.log('Register client controller called');

    const result = await sequelize.query(
      `INSERT INTO auth.usuarios (nombre_completo, email, password)
       VALUES (:name, :email, :password)
       RETURNING *;`,
      {
        replacements: { name, email, password },
        type: QueryTypes.INSERT,
      }
    );

    return result;
  } catch (error) {
    console.error('Error registering client:', error);
    throw new Error('Error registering client');
  }
};


export default {
  register_client,
};

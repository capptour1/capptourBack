import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';


const getCategories = async () => {
    const result = await sequelize.query(
        `
        SELECT
            id_categoria,
            nombre,
            descripcion,
            icono,
            color
        FROM catalogo.categoria_servicio
        WHERE estado = 'A'
        ORDER BY nombre ASC
        `,
        {
            type: QueryTypes.SELECT
        }
    );
    return result;
}

const getCurrencies = async () => {
    const result = await sequelize.query(
        `SELECT * FROM fotografo.tipo_moneda;`,
        {
            type: QueryTypes.SELECT,
        }
    );
    return result;

};


export default {
    getCurrencies,
    getCategories
};

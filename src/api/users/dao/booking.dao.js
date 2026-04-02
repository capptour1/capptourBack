
import sequelize from '../../../models/index.js';
import { QueryTypes } from 'sequelize';
import AppError from '../../../utils/appError.js';

const get_transaction = async () => {
    return await sequelize.transaction({ autocommit: false });
}

export default {
    get_transaction,
};
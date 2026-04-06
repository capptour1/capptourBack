import explorerDao from '../dao/explorer.dao.js';
import AppError from '../../../utils/appError.js';
import HelperResponse from '../../../utils/helperResponse.js';

const { successResponse, errorResponse } = HelperResponse;

const formatDate = (dateStr) => {
    const date = new Date(dateStr);

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}/${date.getUTCFullYear()}`;
};


const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    return `${h}:${m}`;
};


export default {
};
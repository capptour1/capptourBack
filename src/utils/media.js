import sharp from 'sharp';

const createThumbnail = async (file) => {
    try {
        const thumbnailBuffer = await sharp(file.buffer)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 70 }) // reduce tamaño manteniendo buena calidad
            .toBuffer();
        return thumbnailBuffer;
    } catch (error) {
        console.error('Error creating thumbnail:', error);
        throw new Error('Error creating thumbnail');
    }
};

export default {
    createThumbnail,
};
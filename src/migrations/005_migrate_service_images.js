/**
 * Migración de datos: BYTEA → StorageService para imágenes de servicios.
 *
 * - Idempotente: salta registros que ya tienen url_imagen.
 * - Reanudable: cursor por id_imagen.
 * - Procesamiento por lotes.
 *
 * Uso: node src/migrations/005_migrate_service_images.js
 */
import sequelize from '../models/index.js';
import { QueryTypes } from 'sequelize';
import storageService from '../services/storage.service.js';

const BATCH_SIZE = 20;

async function migrate() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');

    const [{ total }] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM fotografo.imagen_servicio
       WHERE url_imagen IS NULL AND imagen IS NOT NULL`,
      { type: QueryTypes.SELECT }
    );

    console.log(`📊 Registros pendientes: ${total}`);
    if (total === 0) {
      console.log('✅ Nada que migrar');
      process.exit(0);
    }

    let migrated = 0;
    let errors = 0;
    let lastId = 0;

    while (true) {
      const batch = await sequelize.query(
        `SELECT id_imagen, id_servicio, imagen, thumbnail
         FROM fotografo.imagen_servicio
         WHERE url_imagen IS NULL AND imagen IS NOT NULL AND id_imagen > :lastId
         ORDER BY id_imagen ASC
         LIMIT :limit`,
        {
          replacements: { lastId, limit: BATCH_SIZE },
          type: QueryTypes.SELECT,
        }
      );

      if (batch.length === 0) break;

      for (const row of batch) {
        try {
          const imageBuffer = Buffer.from(row.imagen);
          const imageResult = await storageService.upload(
            imageBuffer,
            'services/images',
            'image/jpeg'
          );

          let thumbnailPath = null;
          if (row.thumbnail) {
            const thumbBuffer = Buffer.from(row.thumbnail);
            const thumbResult = await storageService.upload(
              thumbBuffer,
              'services/thumbnails',
              'image/jpeg'
            );
            thumbnailPath = thumbResult.path;
          }

          await sequelize.query(
            `UPDATE fotografo.imagen_servicio
             SET url_imagen = :urlImagen,
                 url_thumbnail = :urlThumbnail,
                 mime_type = 'image/jpeg',
                 tamano = :tamano
             WHERE id_imagen = :idImagen`,
            {
              replacements: {
                urlImagen: imageResult.path,
                urlThumbnail: thumbnailPath,
                idImagen: row.id_imagen,
                tamano: imageBuffer.length,
              },
              type: QueryTypes.UPDATE,
            }
          );

          migrated++;
        } catch (err) {
          errors++;
          console.error(`   ❌ Error en id_imagen=${row.id_imagen}: ${err.message}`);
        }

        lastId = row.id_imagen;
      }

      console.log(`   ✅ Lote — migradas: ${migrated}, errores: ${errors}, último ID: ${lastId}`);
    }

    console.log(`\n🎉 Migración completada`);
    console.log(`   Migradas: ${migrated}`);
    console.log(`   Errores: ${errors}`);

    if (errors === 0 && migrated > 0) {
      console.log('\n💡 Para eliminar columnas BYTEA después de verificar:');
      console.log('   ALTER TABLE fotografo.imagen_servicio DROP COLUMN imagen;');
      console.log('   ALTER TABLE fotografo.imagen_servicio DROP COLUMN thumbnail;');
    }

    process.exit(errors > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Error fatal:', err.message);
    process.exit(1);
  }
}

migrate();

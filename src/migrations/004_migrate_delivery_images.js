/**
 * Migración de datos: BYTEA → StorageService
 *
 * Lee las imágenes de entrega almacenadas como BYTEA,
 * las escribe al filesystem mediante StorageService,
 * y actualiza las columnas url_imagen y url_thumbnail.
 *
 * - Idempotente: salta registros que ya tienen url_imagen.
 * - Reanudable: si falla, volver a ejecutar continúa desde donde quedó.
 * - Procesamiento por lotes para evitar cargar toda la BD en memoria.
 * - No elimina datos BYTEA (se eliminan manualmente después de verificar).
 *
 * Uso: node src/migrations/004_migrate_delivery_images.js
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

    // Contar total pendiente
    const [{ total }] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM reserva.imagenes_entrega
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
      // Obtener un lote a partir del último ID procesado
      const batch = await sequelize.query(
        `SELECT id_imagen, id_entrega, imagen, thumbnail
         FROM reserva.imagenes_entrega
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
          // Subir imagen principal
          const imageBuffer = Buffer.from(row.imagen);
          const imageResult = await storageService.upload(
            imageBuffer,
            'deliveries/images',
            'image/jpeg'
          );

          // Subir thumbnail si existe
          let thumbnailPath = null;
          if (row.thumbnail) {
            const thumbBuffer = Buffer.from(row.thumbnail);
            const thumbResult = await storageService.upload(
              thumbBuffer,
              'deliveries/thumbnails',
              'image/jpeg'
            );
            thumbnailPath = thumbResult.path;
          }

          // Actualizar registro — solo si el archivo se escribió correctamente
          await sequelize.query(
            `UPDATE reserva.imagenes_entrega
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

      console.log(`   ✅ Lote completado — migradas: ${migrated}, errores: ${errors}, último ID: ${lastId}`);
    }

    console.log(`\n🎉 Migración completada`);
    console.log(`   Migradas: ${migrated}`);
    console.log(`   Errores: ${errors}`);
    console.log(`   Total procesado: ${migrated + errors}`);

    if (errors === 0 && migrated > 0) {
      console.log('\n💡 Para eliminar las columnas BYTEA después de verificar:');
      console.log('   ALTER TABLE reserva.imagenes_entrega DROP COLUMN imagen;');
      console.log('   ALTER TABLE reserva.imagenes_entrega DROP COLUMN thumbnail;');
    }

    process.exit(errors > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Error fatal:', err.message);
    process.exit(1);
  }
}

migrate();

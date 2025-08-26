import 'dotenv/config';
import pkg from 'pg';

const { Pool } = pkg;

// ✅ CONEXIÓN INTELIGENTE (funciona en local y producción)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || {
    // Fallback para desarrollo local
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
  }
});

// Verificar conexión
pool.connect()
  .then(client => {
    console.log('✅ Conexión a la base de datos exitosa');
    console.log('🔄 Modo:', process.env.NODE_ENV || 'development');
    client.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err.message);
  });

export default pool;
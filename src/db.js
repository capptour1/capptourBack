import 'dotenv/config';
import pkg from 'pg';

const { Pool } = pkg;

// ✅ CONEXIÓN INTELIGENTE MEJORADA
const getConnectionConfig = () => {
  // URL EXACTA de Railway (la pública)
  const railwayDbUrl = 'postgresql://postgres:YAuCnaJxZmOIFpBmsuyyQvzhLceqLIVA@nozomi.proxy.rlwy.net:30044/railway';

  // Si estamos en producción Y la URL de Railway existe, usarla
  if (process.env.NODE_ENV === 'production' && railwayDbUrl) {
    console.log('🔄 Usando URL pública de Railway');
    return {
      connectionString: railwayDbUrl,
      ssl: { rejectUnauthorized: false }
    };
  } else {
    // Fallback para desarrollo local
    console.log('🔄 Usando variables de entorno para desarrollo');
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'neondb',
      user: process.env.DB_USER || 'neondb_owner',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
    };
  }
};

const pool = new Pool(getConnectionConfig());

// Verificar conexión
pool.connect()
  .then(client => {
    console.log('✅ Conexión a la base de datos exitosa');
    console.log('🔧 Modo:', process.env.NODE_ENV || 'development');
    client.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err.message);
    console.log('🔍 Variables:', {
      nodeEnv: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL
    });
  });

export default pool;
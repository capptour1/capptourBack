import 'dotenv/config';
import pkg from 'pg';

const { Pool } = pkg;

// ✅ CONEXIÓN SEGURA para Railway (usando URL PÚBLICA)
const getConnectionConfig = () => {
  // URL PÚBLICA de Railway
  const railwayDbUrl = 'postgresql://postgres:YAuCnaJxZmOIFpBmsuyyQvzhLceqLIVA@nozomi.proxy.rlwy.net:30044/railway';
  
  console.log('🔄 Usando DATABASE_URL pública de Railway');
  return {
    connectionString: railwayDbUrl,
    ssl: { 
      rejectUnauthorized: false,
      require: true
    }
  };
};

const pool = new Pool(getConnectionConfig());

// Verificar conexión
pool.connect()
  .then(client => {
    console.log('✅ Conexión a la base de datos exitosa (Railway)');
    console.log('🔧 Usando URL pública');
    client.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err.message);
    console.log('🔍 URL utilizada:', 'postgresql://postgres:YAuCnaJxZmOIFpBmsuyyQvzhLceqLIVA@nozomi.proxy.rlwy.net:30044/railway');
  });

export default pool;
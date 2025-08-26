import 'dotenv/config';
import pkg from 'pg';

const { Pool } = pkg;

// ✅ CONTRASEÑA CORRECTA DE RAILWAY
const getConnectionConfig = () => {
  const railwayDbUrl = 'postgresql://postgres:YAuCnaJxZm0IFpBmsuyyQvzhLceqL1VA@nozomi.proxy.rlwy.net:30044/railway';
  
  console.log('🔄 Usando URL pública de Railway');
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
    client.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar:', err.message);
  });

export default pool;
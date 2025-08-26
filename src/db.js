import 'dotenv/config';
import pkg from 'pg';

const { Pool } = pkg;

// ✅ CONEXIÓN CON CONTRASEÑA CORRECTA
const getConnectionConfig = () => {
  // URL con la contraseña ORIGINAL que me diste
  const railwayDbUrl = 'postgresql://postgres:npg_q9jxE7PcVRDH@nozomi.proxy.rlwy.net:30044/railway';

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
    console.log('🔧 Contraseña correcta');
    client.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err.message);
    console.log('🔍 URL utilizada:', 'postgresql://postgres:npg_q9jxE7PcVRDH@nozomi.proxy.rlwy.net:30044/railway');
  });

export default pool;

import AuthDAO from '../dao/auth.dao.js';


/*
   POST /
   Registro normal (sin archivo) + envío de código
   NOTA: hashea password en producción (bcrypt)
========================= 
router.post('/', async (req, res) => {
  const { nombre, email, password, rol_id, telefono, servicio_id } = req.body;

  if (!nombre || !email || !password || !rol_id || !telefono || !servicio_id) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    const insertQuery = `
      INSERT INTO auth.usuarios
      (nombre_completo, email, password, rol_id, telefono, servicio_id, creado_en, estado, verificado, codigo_verificacion)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'A', false, $7)
      RETURNING *;
    `;

    const values = [nombre, email, password, rol_id, telefono, servicio_id ?? null, codigo];
    const result = await pool.query(insertQuery, values);

    await sendVerificationEmail({ to: email, codigo, brand: 'Capptour' });

    return res.status(201).json({
      message: 'Usuario registrado. Código enviado al correo.',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

*/

const register_client = async (req, res) => {
    try {
        console.log('Register client controller called');
        const { name, email, password } = req.body;

        const result = await AuthDAO.register_client(name, email, password);
        res.status(200).json(result);

    } catch (error) {
        console.error('Error in register client controller:', error);
        res.status(500).json({ message: 'Error in register client controller' });
    }
}

export default {
  register_client,
};


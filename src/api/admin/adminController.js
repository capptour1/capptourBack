import pool from '../../db.js';

// Obtener todas las clasificaciones de fotógrafos
export const clases = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM auth.clasificacion_fotografo ORDER BY id');
    res.status(200).json({
      success: true,
      data: result.rows,
      message: 'Clasificaciones obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error obteniendo clasificaciones:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error del servidor al obtener clasificaciones' 
    });
  }
};

// Obtener todos los usuarios o uno específico
export const usuarios = async (req, res) => {
  try {
    const { id } = req.params;
    
    let query, params;
    if (id) {
      query = `
        SELECT u.id, u.nombre_completo, u.email, u.rol_id, u.telefono, 
               u.servicio_id, u.estado, u.verificado, u.creado_en,
               f.descripcion as fotografo_descripcion, f.tarifas
        FROM auth.usuarios u
        LEFT JOIN fotografo.fotografos f ON u.id = f.usuario_id
        WHERE u.id = $1
      `;
      params = [id];
    } else {
      query = `
        SELECT u.id, u.nombre_completo, u.email, u.rol_id, 
               u.servicio_id, u.estado, u.verificado, u.creado_en,
               COUNT(f.id) as es_fotografo, r.nombre as rol_nombre
        FROM auth.usuarios u
        LEFT JOIN fotografo.fotografos f ON u.id = f.usuario_id
        join auth.roles r on u.rol_id = r.id
        GROUP BY u.id, u.nombre_completo, u.email, u.rol_id, 
                 u.servicio_id, u.estado, u.verificado, u.creado_en, r.nombre
        ORDER BY u.creado_en DESC
      `;
      params = [];
    }

    const result = await pool.query(query, params);
    
    if (id && result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuario no encontrado' 
      });
    }

    res.status(200).json({
      success: true,
      data: id ? result.rows[0] : result.rows,
      message: id ? 'Usuario obtenido exitosamente' : 'Usuarios obtenidos exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error del servidor al obtener usuarios' 
    });
  }
};

// Actualizar estado de usuario (activar/desactivar)
export const actualizarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['A', 'I'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido. Debe ser "A" (activo) o "I" (inactivo)'
      });
    }

    const result = await pool.query(
      'UPDATE auth.usuarios SET estado = $1 WHERE id = $2 RETURNING id, nombre_completo, estado',
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: `Usuario ${estado === 'A' ? 'activado' : 'desactivado'} exitosamente`
    });

  } catch (error) {
    console.error('Error actualizando estado usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error del servidor al actualizar estado'
    });
  }
};

// Obtener estadísticas del dashboard
export const estadisticas = async (req, res) => {
  try {
    const queries = [
      // Total usuarios
      pool.query('SELECT COUNT(*) as total_usuarios FROM auth.usuarios'),
      // Usuarios activos
      pool.query('SELECT COUNT(*) as usuarios_activos FROM auth.usuarios WHERE estado = $1', ['A']),
      // Total fotógrafos
      pool.query('SELECT COUNT(*) as total_fotografos FROM fotografo.fotografos'),
      // Usuarios verificados
      pool.query('SELECT COUNT(*) as usuarios_verificados FROM auth.usuarios WHERE verificado = true'),
      // Usuarios por rol
      pool.query(`
        SELECT rol_id, COUNT(*) as cantidad 
        FROM auth.usuarios 
        GROUP BY rol_id 
        ORDER BY rol_id
      `),
      // Registros recientes (últimos 7 días)
      pool.query(`
        SELECT COUNT(*) as registros_recientes 
        FROM auth.usuarios 
        WHERE creado_en >= NOW() - INTERVAL '7 days'
      `)
    ];

    const results = await Promise.all(queries);

    const estadisticas = {
      total_usuarios: parseInt(results[0].rows[0].total_usuarios),
      usuarios_activos: parseInt(results[1].rows[0].usuarios_activos),
      total_fotografos: parseInt(results[2].rows[0].total_fotografos),
      usuarios_verificados: parseInt(results[3].rows[0].usuarios_verificados),
      usuarios_por_rol: results[4].rows,
      registros_recientes: parseInt(results[5].rows[0].registros_recientes)
    };

    res.status(200).json({
      success: true,
      data: estadisticas,
      message: 'Estadísticas obtenidas exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error del servidor al obtener estadísticas'
    });
  }
};

// Obtener fotógrafos con detalles
export const fotografos = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [limit, offset];
    
    if (estado) {
      whereClause = 'WHERE u.estado = $3';
      params.push(estado);
    }

    const query = `
      SELECT 
        u.id, u.nombre_completo, u.email, u.estado, u.verificado, u.creado_en,
       f.*,
        COUNT(s.id_servicio) as total_servicios
      FROM auth.usuarios u
      INNER JOIN fotografo.fotografos f ON u.id = f.usuario_id
      LEFT JOIN fotografo.foto_servicio s ON f.id = s.id_fotografo
      ${whereClause}
      GROUP BY u.id, u.nombre_completo, u.email, u.estado, u.verificado, u.creado_en,
                f.id, f.usuario_id, f.creado_en, f.is_active, f.updated_at
      ORDER BY u.creado_en DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM auth.usuarios u
      INNER JOIN fotografo.fotografos f ON u.id = f.usuario_id
      ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, estado ? [estado] : [])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        fotografos: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: parseInt(limit)
        }
      },
      message: 'Fotógrafos obtenidos exitosamente'
    });

  } catch (error) {
    console.error('Error obteniendo fotógrafos:', error);
    res.status(500).json({
      success: false,
      error: 'Error del servidor al obtener fotógrafos'
    });
  }
};

// Eliminar usuario (soft delete)
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const userCheck = await pool.query('SELECT id FROM auth.usuarios WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Soft delete - cambiar estado a inactivo
    await pool.query('UPDATE auth.usuarios SET estado = $1 WHERE id = $2', ['I', id]);

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error del servidor al eliminar usuario'
    });
  }
};


const datosUsuario = async (req,res) => {
  try {
    const usuarioId = req.params.id;
    console.log('Obteniendo datos para usuario ID:', usuarioId);
    const result = await pool.query(
      'SELECT id, nombre_completo, email, rol_id, estado, verificado, creado_en FROM auth.usuarios WHERE id = $1',
      [usuarioId]

    );
     res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo datos de usuario:', error);
    throw error;
  }};
export default {
  clases,
  usuarios,
  actualizarEstadoUsuario,
  estadisticas,
  fotografos,
  eliminarUsuario,
  datosUsuario
};
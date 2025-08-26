import pool from '../../db.js';

export const clases = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM auth.clasificacion_fotografo');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};
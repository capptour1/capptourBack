import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SesionFotoInmediata = sequelize.define('SesionFotoInmediata', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  token: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  colaborador_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('activa', 'finalizada', 'expirada'),
    defaultValue: 'activa'
  },
  fotos_subidas: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_finalizacion: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'sesiones_foto_inmediata',
  schema: 'fotografo',
  timestamps: false
});

export default SesionFotoInmediata;
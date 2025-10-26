import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FotoSesionInmediata = sequelize.define('FotoSesionInmediata', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sesion_token: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  foto_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fecha_subida: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'fotos_sesion_inmediata',
  schema: 'fotografo',
  timestamps: false
});

export default FotoSesionInmediata;
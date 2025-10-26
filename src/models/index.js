import sequelize from '../config/database.js';
import SesionFotoInmediata from './SesionFotoInmediata.js';
import FotoSesionInmediata from './FotoSesionInmediata.js';
import Usuario from './Usuario.js';

// Definir asociaciones
SesionFotoInmediata.belongsTo(Usuario, { 
  foreignKey: 'cliente_id', 
  as: 'cliente' 
});

SesionFotoInmediata.belongsTo(Usuario, { 
  foreignKey: 'colaborador_id', 
  as: 'colaborador' 
});

FotoSesionInmediata.belongsTo(SesionFotoInmediata, { 
  foreignKey: 'sesion_token',
  targetKey: 'token',
  as: 'sesion' 
});

SesionFotoInmediata.hasMany(FotoSesionInmediata, { 
  foreignKey: 'sesion_token',
  sourceKey: 'token',
  as: 'fotos' 
});

export {
  sequelize,
  SesionFotoInmediata,
  FotoSesionInmediata,
  Usuario
};

export default {
  sequelize,
  SesionFotoInmediata,
  FotoSesionInmediata,
  Usuario
};
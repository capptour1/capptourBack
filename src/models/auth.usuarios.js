export default (sequelize, DataTypes) => {
    const Usuarios = sequelize.define('Usuarios', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        nombre_completo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tipo_usuario: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        creado_en: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'A',
        },
        servicio_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        codigo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        verificado: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        },
        codigo_verificacion: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        id_pais: {
            type: DataTypes.BIGINT,
            allowNull: true,
            primaryKey: true,
        },
        id_genero: {
            type: DataTypes.INTEGER,
            allowNull: true,
            primaryKey: true,
        },
        fecha_nacimiento: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        foto_perfil: {
            type: DataTypes.BLOB,
            allowNull: true,
        },
        proveedor_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        proveedor_auth: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'local',
        },
    }, {
        tableName: 'usuarios',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'auth',
    });

    Usuarios.associate = (models) => {
        models.Usuarios.belongsTo(models.Generos, {
            foreignKey: 'id_genero',
            targetKey: 'id_genero',
            as: 'genero',
        });
        models.Usuarios.belongsTo(models.Paises, {
            foreignKey: 'id_pais',
            targetKey: 'id_pais',
            as: 'pais',
        });
        models.Usuarios.belongsTo(models.TipoUsuario, {
            foreignKey: 'tipo_usuario',
            targetKey: 'id',
            as: 'tipoUsuario',
        });
        models.Usuarios.hasMany(models.Sesiones, {
            foreignKey: 'id_usuario',
            sourceKey: 'id',
            as: 'sesiones',
        });
        models.Usuarios.hasMany(models.UbicacionesActivas, {
            foreignKey: 'usuario_id',
            sourceKey: 'id',
            as: 'ubicacionesActivas',
        });
        models.Usuarios.hasMany(models.UsuarioTelefono, {
            foreignKey: 'id_usuario',
            sourceKey: 'id',
            as: 'telefonos',
        });
        models.Usuarios.hasMany(models.Conversacion, {
            foreignKey: 'id_cliente',
            sourceKey: 'id',
            as: 'conversaciones',
        });
        models.Usuarios.hasMany(models.Mensajes, {
            foreignKey: 'emisor',
            sourceKey: 'id',
            as: 'mensajes',
        });
        models.Usuarios.hasMany(models.Fotografos, {
            foreignKey: 'id_usuario',
            sourceKey: 'id',
            as: 'fotografos',
        });
        models.Usuarios.hasMany(models.Notificaciones, {
            foreignKey: 'id_usuario',
            sourceKey: 'id',
            as: 'notificaciones',
        });
        models.Usuarios.hasMany(models.SuscripcionesUsuario, {
            foreignKey: 'usuario_id',
            sourceKey: 'id',
            as: 'suscripciones',
        });
        models.Usuarios.hasMany(models.TransaccionesWompi, {
            foreignKey: 'usuario_id',
            sourceKey: 'id',
            as: 'transacciones',
        });
        models.Usuarios.hasMany(models.Reserva, {
            foreignKey: 'id_cliente',
            sourceKey: 'id',
            as: 'reservasCliente',
        });
        models.Usuarios.hasMany(models.Reserva, {
            foreignKey: 'id_fotografo',
            sourceKey: 'id',
            as: 'reservasFotografo',
        });
    };

    return Usuarios;
};
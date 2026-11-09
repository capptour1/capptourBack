export default (sequelize, DataTypes) => {
    const Fotografos = sequelize.define('Fotografos', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: true,
            primaryKey: true,
        },
        creado_en: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        id_experiencia: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            defaultValue: 1,
        },
        id_rol: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            defaultValue: 1,
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        herramientas: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'fotografos',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'fotografo',
    });

    Fotografos.associate = (models) => {
        models.Fotografos.belongsTo(models.TipoExperiencia, {
            foreignKey: 'id_experiencia',
            targetKey: 'id_experiencia',
            as: 'tipoExperiencia',
        });
        models.Fotografos.belongsTo(models.TipoRol, {
            foreignKey: 'id_rol',
            targetKey: 'id_rol',
            as: 'tipoRol',
        });
        models.Fotografos.belongsTo(models.Usuarios, {
            foreignKey: 'id_usuario',
            targetKey: 'id',
            as: 'usuario',
        });
        models.Fotografos.hasMany(models.Conversacion, {
            foreignKey: 'id_fotografo',
            sourceKey: 'id',
            as: 'conversaciones',
        });
        models.Fotografos.hasMany(models.Servicios, {
            foreignKey: 'id_fotografo',
            sourceKey: 'id',
            as: 'servicios',
        });
        models.Fotografos.hasMany(models.ColaboradorServicioGlobal, {
            foreignKey: 'id_fotografo',
            sourceKey: 'id',
            as: 'colaboraciones',
        });
        models.Fotografos.hasMany(models.Localizacion, {
            foreignKey: 'id_fotografo',
            sourceKey: 'id',
            as: 'localizaciones',
        });
        models.Fotografos.hasMany(models.Reserva, {
            foreignKey: 'id_fotografo',
            sourceKey: 'id',
            as: 'reservas',
        });
    };

    return Fotografos;
};
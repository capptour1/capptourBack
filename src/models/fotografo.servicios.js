export default (sequelize, DataTypes) => {
    const Servicios = sequelize.define('Servicios', {
        id_servicio: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        descripcion: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        precio_hora: {
            type: DataTypes.DECIMAL,
            allowNull: false,
            defaultValue: 0,
        },
        editadas: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },
        no_editadas: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'A',
        },
        id_fotografo: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        fec_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        id_moneda: {
            type: DataTypes.INTEGER,
            allowNull: true,
            primaryKey: true,
        },
    }, {
        tableName: 'servicios',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'fotografo',
    });

    Servicios.associate = (models) => {
        models.Servicios.belongsTo(models.Fotografos, {
            foreignKey: 'id_fotografo',
            targetKey: 'id',
            as: 'fotografo',
        });
        models.Servicios.belongsTo(models.TipoMoneda, {
            foreignKey: 'id_moneda',
            targetKey: 'id_moneda',
            as: 'tipoMoneda',
        });
        models.Servicios.hasMany(models.ImagenServicio, {
            foreignKey: 'id_servicio',
            sourceKey: 'id_servicio',
            as: 'imagenesServicio',
        });
        models.Servicios.hasMany(models.ServicioCategoria, {
            foreignKey: 'id_servicio',
            sourceKey: 'id_servicio',
            as: 'categorias',
        });
    };

    return Servicios;
};
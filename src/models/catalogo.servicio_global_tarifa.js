export default (sequelize, DataTypes) => {
    const ServicioGlobalTarifa = sequelize.define('ServicioGlobalTarifa', {
        id_tarifa: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_servicio_global: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        id_cobertura: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        precio_base: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        precio_minimo: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        id_moneda: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        fecha_inicio: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        fecha_fin: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'A',
        },
        fec_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'servicio_global_tarifa',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'catalogo',
    });

    ServicioGlobalTarifa.associate = (models) => {
        models.ServicioGlobalTarifa.belongsTo(models.TipoMoneda, {
            foreignKey: 'id_moneda',
            targetKey: 'id_moneda',
            as: 'TipoMoneda',
        });
        models.ServicioGlobalTarifa.belongsTo(models.Cobertura, {
            foreignKey: 'id_cobertura',
            targetKey: 'id_cobertura',
            as: 'cobertura',
        });
        models.ServicioGlobalTarifa.belongsTo(models.ServicioGlobal, {
            foreignKey: 'id_servicio_global',
            targetKey: 'id_servicio_global',
            as: 'servicioGlobal',
        });
        models.ServicioGlobalTarifa.hasMany(models.ReservaServicio, {
            foreignKey: 'id_tarifa',
            sourceKey: 'id_tarifa',
            as: 'reservasServicio',
        });
    };

    return ServicioGlobalTarifa;
};
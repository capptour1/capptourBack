export default (sequelize, DataTypes) => {
    const ServicioGlobal = sequelize.define('ServicioGlobal', {
        id_servicio_global: {
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
            type: DataTypes.TEXT,
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
        tableName: 'servicio_global',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'catalogo',
    });

    ServicioGlobal.associate = (models) => {
        models.ServicioGlobal.hasMany(models.ServicioGlobalTarifa, {
            foreignKey: 'id_servicio_global',
            sourceKey: 'id_servicio_global',
            as: 'serviciosGlobalTarifa',
        });
        models.ServicioGlobal.hasMany(models.ColaboradorServicioGlobal, {
            foreignKey: 'id_servicio_global',
            sourceKey: 'id_servicio_global',
            as: 'colaboradores',
        });
    };

    return ServicioGlobal;
};
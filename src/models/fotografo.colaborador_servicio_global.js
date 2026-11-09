export default (sequelize, DataTypes) => {
    const ColaboradorServicioGlobal = sequelize.define('ColaboradorServicioGlobal', {
        id_colaborador_servicio: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_fotografo: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        id_servicio_global: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
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
        tableName: 'colaborador_servicio_global',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'fotografo',
    });

    ColaboradorServicioGlobal.associate = (models) => {
        models.ColaboradorServicioGlobal.belongsTo(models.Fotografos, {
            foreignKey: 'id_fotografo',
            targetKey: 'id',
            as: 'fotografo',
        });
        models.ColaboradorServicioGlobal.belongsTo(models.ServicioGlobal, {
            foreignKey: 'id_servicio_global',
            targetKey: 'id_servicio_global',
            as: 'servicioGlobal',
        });
    };

    return ColaboradorServicioGlobal;
};
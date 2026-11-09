export default (sequelize, DataTypes) => {
    const ReservaServicio = sequelize.define('ReservaServicio', {
        id_reserva_servicio: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_reserva: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        id_origen: {
            type: DataTypes.BIGINT,
            allowNull: true,
            primaryKey: true,
        },
        id_tarifa: {
            type: DataTypes.BIGINT,
            allowNull: true,
            primaryKey: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        editadas: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
        no_editadas: {
            type: DataTypes.SMALLINT,
            allowNull: false,
        },
        precio_base: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        precio_minimo: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        precio_final: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        id_moneda: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        fec_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        origen: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'F',
        },
        cantidad: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 1,
        },
    }, {
        tableName: 'reserva_servicio',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'reserva',
    });

    ReservaServicio.associate = (models) => {
        models.ReservaServicio.belongsTo(models.Reserva, {
            foreignKey: 'id_reserva',
            targetKey: 'id_reserva',
            as: 'reserva',
        });
        models.ReservaServicio.belongsTo(models.ServicioGlobalTarifa, {
            foreignKey: 'id_tarifa',
            targetKey: 'id_tarifa',
            as: 'servicioGlobalTarifa',
        });
        models.ReservaServicio.belongsTo(models.TipoMoneda, {
            foreignKey: 'id_moneda',
            targetKey: 'id_moneda',
            as: 'tipoMoneda',
        });
    };

    return ReservaServicio;
};
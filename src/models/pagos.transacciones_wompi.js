export default (sequelize, DataTypes) => {
    const TransaccionesWompi = sequelize.define('TransaccionesWompi', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        membresia_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        referencia: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        wompi_transaccion_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        monto_en_centavos: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'PENDING',
        },
        datos_wompi: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: '{}',
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        fecha_actualizacion: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'transacciones_wompi',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'pagos',
    });

    TransaccionesWompi.associate = (models) => {
        models.TransaccionesWompi.belongsTo(models.Membresias, {
            foreignKey: 'membresia_id',
            targetKey: 'id_membresia',
            as: 'membresia',
        });
        models.TransaccionesWompi.belongsTo(models.Usuarios, {
            foreignKey: 'usuario_id',
            targetKey: 'id',
            as: 'usuario',
        });
        models.TransaccionesWompi.hasMany(models.SuscripcionesUsuario, {
            foreignKey: 'transaccion_id',
            sourceKey: 'id',
            as: 'suscripcionesUsuario',
        });
    };

    return TransaccionesWompi;
};
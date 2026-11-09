export default (sequelize, DataTypes) => {
    const SuscripcionesUsuario = sequelize.define('SuscripcionesUsuario', {
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
        transaccion_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        fecha_inicio: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        fecha_fin: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'activa',
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
        tableName: 'suscripciones_usuario',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'pagos',
    });

    SuscripcionesUsuario.associate = (models) => {
        models.SuscripcionesUsuario.belongsTo(models.Membresias, {
            foreignKey: 'membresia_id',
            targetKey: 'id_membresia',
            as: 'membresia',
        });
        models.SuscripcionesUsuario.belongsTo(models.TransaccionesWompi, {
            foreignKey: 'transaccion_id',
            targetKey: 'id',
            as: 'transaccionWompi',
        });
        models.SuscripcionesUsuario.belongsTo(models.Usuarios, {
            foreignKey: 'usuario_id',
            targetKey: 'id',
            as: 'usuario',
        });
    };

    return SuscripcionesUsuario;
};
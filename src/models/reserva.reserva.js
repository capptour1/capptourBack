export default (sequelize, DataTypes) => {
    const Reserva = sequelize.define('Reserva', {
        id_reserva: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        id_cliente: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        fecha: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        hora_inicio: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        hora_fin: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        longitud: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        latitud: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
        notas: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fec_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        estado: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'P',
        },
        id_fotografo: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
    }, {
        tableName: 'reserva',
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        schema: 'reserva',
    });

    Reserva.associate = (models) => {
        models.Reserva.belongsTo(models.Fotografos, {
            foreignKey: 'id_fotografo',
            targetKey: 'id',
            as: 'fotografo',
        });
        models.Reserva.belongsTo(models.Usuarios, {
            foreignKey: 'id_cliente',
            targetKey: 'id',
            as: 'cliente',
        });
        models.Reserva.hasMany(models.FotoCalificacion, {
            foreignKey: 'id_reserva',
            sourceKey: 'id_reserva',
            as: 'calificaciones',
        });
        models.Reserva.hasMany(models.ReservaCamara, {
            foreignKey: 'id_reserva',
            sourceKey: 'id_reserva',
            as: 'reservasCamara',
        });
        models.Reserva.hasOne(models.ReservaServicio, {
            foreignKey: 'id_reserva',
            sourceKey: 'id_reserva',
            as: 'reservaServicio',
        });
        models.Reserva.hasMany(models.Entrega, {
            foreignKey: 'id_reserva',
            sourceKey: 'id_reserva',
            as: 'entregas',
        });
    };

    return Reserva;
};